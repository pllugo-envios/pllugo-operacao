import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {CLIENTS,clientSlug,clientLogo} from '../lib/clients.ts';
import {createBrandMarkup} from '../lib/brand-markup.ts';
import {includeAnjun} from './build-sla-anjun.mjs';
export async function buildSla(){
 let html=includeAnjun(await readFile('modules/sla/source.html','utf8'));
 const brandCatalog=Object.fromEntries(CLIENTS.map(name=>[name,{slug:clientSlug(name),logo:'../../'+clientLogo(name).replace(/^\//,'')}]));
 const replace=(from,to)=>{if(!html.includes(from))throw Error('SLA integration anchor changed: '+from.slice(0,80));html=html.replace(from,to)};
 replace('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1"></script>','<script src="vendor/chart-4.4.1.js"></script>');
 replace('<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>','');
 replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script>'+await readFile('modules/sla/bridge.js','utf8')+'</script>');
 const start=html.indexOf('const SUPABASE_URL ='),end=html.indexOf('var DASH_DATA =',start);if(start<0||end<0)throw Error('SLA auth adapter anchor changed');
 html=html.slice(0,start)+`const sb=window.pllugoSlaClient;
const slaBrand=(${createBrandMarkup.toString()})(${JSON.stringify(brandCatalog)});
function slaBrandText(value){return String(value??'').split(/(J&T|iMile|Pllugo|Anjun)/gi).map((part,i)=>i%2?slaBrand(part):escapeHTML(part)).join('')}
document.querySelectorAll('[data-carrier]').forEach(button=>{button.innerHTML=slaBrand(button.dataset.carrier)});
document.getElementById('anjun-awaiting-panel')?.insertAdjacentHTML('afterbegin',slaBrand('Anjun'));
let workbookLoading;
function ensureWorkbookLibrary(){return window.XLSX?Promise.resolve():(workbookLoading||=(new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/xlsx-0.18.5.js';script.onload=resolve;script.onerror=()=>{workbookLoading=null;reject(Error('Não foi possível carregar o leitor de planilhas. Tente novamente.'))};document.head.appendChild(script)})))}
async function workbookReady(){try{await ensureWorkbookLibrary();return true}catch(e){showToast(e.message,'Planilhas');return false}}
`+html.slice(end);
 const brandReplace=(from,to)=>{if(!html.includes(from))throw Error('SLA brand anchor changed: '+from.slice(0,80));html=html.replaceAll(from,to)};
 brandReplace('${escapeHTML(d.carrier)}','${slaBrand(d.carrier)}');
 brandReplace('${escapeHTML(found.carrier)}','${slaBrand(found.carrier)}');
 brandReplace('${escapeHTML(d.carrier||\'Pllugo\')}','${slaBrand(d.carrier||\'Pllugo\')}');
 brandReplace('class="entity-name">${escapeHTML(name)}','class="entity-name">${slaBrand(name)}');
 brandReplace("escapeHTML(r.sourceLabel)","slaBrand(r.sourceLabel)");
 brandReplace("escapeHTML(bmSourceLabel(order.source))","slaBrand(bmSourceLabel(order.source))");
 brandReplace("escapeHTML(r.source||d.carrier||'Pllugo')","slaBrand(r.source||d.carrier||'Pllugo')");
 brandReplace("$('#hero-label').textContent = `SLA ${carrierName} · ${periodLabel}`;","$('#hero-label').innerHTML = `SLA ${slaBrand(carrierName)} · ${escapeHTML(periodLabel)}`;");
 brandReplace("$('#operation-scope').textContent = `${unitName} · ${carrierLabels[state.carrier] || 'Pllugo'}`;","$('#operation-scope').innerHTML = `${escapeHTML(unitName)} · ${slaBrand(carrierLabels[state.carrier] || 'Pllugo')}`;");
 brandReplace('escapeHTML(f.name)','slaBrandText(f.name)');
 // Only display labels change. Business values, filter keys and exports retain
 // the original strings. Labels remain accessible and copyable as text.
 brandReplace("$('#app-drawer-sub').textContent=sub||'—';","$('#app-drawer-sub').innerHTML=slaBrandText(sub||'—');");
 brandReplace('escapeHTML(fmtLabel ? fmtLabel(e) : e.label)','slaBrand(fmtLabel ? fmtLabel(e) : e.label)');
 brandReplace('escapeHTML(String(r.label))','slaBrand(String(r.label))');
 replace('</body>',`<script>
const originalQualityDisplay=renderDataQuality;
renderDataQuality=function(...args){originalQualityDisplay(...args);for(const id of ['data-quality-title','data-quality-text']){const el=document.getElementById(id);if(el)el.innerHTML=slaBrandText(el.textContent)}};
</script></body>`);
 replace('async function handleFilesSelected(fileList) {','async function handleFilesSelected(fileList) {\n  try{await ensureWorkbookLibrary()}catch(e){setImportStatus(e.message,\'err\');return}');
 replace('function exportBaseRows(rows, filename) {','async function exportBaseRows(rows, filename) {\n  if(!await workbookReady())return;');
 replace("$('#bm-export-backlog')?.addEventListener('click', () => {","$('#bm-export-backlog')?.addEventListener('click', async () => {\n    if(!await workbookReady())return;");
 replace("$('#bm-export-analytics')?.addEventListener('click', () => {","$('#bm-export-analytics')?.addEventListener('click', async () => {\n    if(!await workbookReady())return;");
 replace("    sb.auth.getSession().then(function (r) { if (r.data.session) pdInit(); });",'    window.pllugoDriverInit=pdInit;');
 replace("    sb.auth.onAuthStateChange(function (_event, session) { if (session) pdInit(); });",'');
 // On-demand Driver section, with the same scoped RLS as the standalone tool.
 replace('  await captureTowerSnapshot();',"  if(state.mode==='torre')await captureTowerSnapshot();");
 replace('function selectMode(m) {',"function selectMode(m) {\n  window.pllugoSlaSelected(m);\n  if(m==='torre')void captureTowerSnapshot();");
 // The original demo reset is deliberately absent from the integrated app.
 replace("$('#btn-clear-data').addEventListener('click', clearAllData);",'');
 html=html.replace(/<button class="btn-clear" id="btn-clear-data"[^>]*>[\s\S]*?<\/button>/,'');
 html=html.replace(/<button class="btn-clear" id="btn-sound-alerts"[^>]*>[\s\S]*?<\/button>/,'');
 html=html.replace(/<button class="btn-update" id="btn-update-dash"[^>]*>[\s\S]*?<\/button>/,'');
 html=html.replace(/^\$\('#btn-sound-alerts'\)\.addEventListener.*$/m,'');
 html=html.replace(/^  \$\('#btn-sound-alerts'\)\.textContent=.*$/m,'');
 replace("$('#btn-update-dash').addEventListener('click', () => $('#upload-input').click());",'');
 replace("let soundAlertsEnabled = true; try { soundAlertsEnabled = localStorage.getItem('pllugo_sound_alerts_v2') !== 'off'; } catch(e) {}",'const soundAlertsEnabled = false;');
 replace("const btn = $('#btn-update-dash'), label = $('#btn-update-label');","const btn = document.createElement('button'), label = document.createElement('span');");
 replace('<span style="font-size:11px; color:var(--gray-500);">visível só para admin</span>','<button type="button" id="robot-panel-close" aria-label="Fechar motor de dados" style="padding:8px 12px;border:1px solid #eee;border-radius:8px;background:#fff;cursor:pointer">✕</button>');
 replace("$('#btn-robot')?.addEventListener('click', () => {","$('#robot-panel-close')?.addEventListener('click',()=>{$('#robot-panel').style.display='none'});\ndocument.addEventListener('keydown',e=>{if(e.key==='Escape')$('#robot-panel').style.display='none'});\n$('#btn-robot')?.addEventListener('click', () => {");
 html=html.replace(/<link[^>]+href="https:\/\/fonts\.[^>]+>/g,'');
 const csp=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; media-src 'self' blob:; form-action 'none'; base-uri 'self' http://127.0.0.1:* https://pllugo-envios.github.io">`;
 replace('<head>','<head>'+csp);
 replace('</head>',`<style>
 #login-screen,#btn-logout,.topbar-user,.mode-tabs,#pd-root{display:none!important}
 .driver-only #pd-root{display:block!important}.driver-only main,.driver-only .filters,.driver-only #import-status-bar{display:none!important}
 header{position:relative!important;top:auto!important}.topbar-brand,.topbar .brand{display:none!important}
 .container{max-width:none!important}.topbar{padding-top:8px!important;padding-bottom:8px!important}
 body{min-width:0!important}#pd-root{margin-top:12px!important}
 .filters,.carrier-tabs{position:static!important;top:auto!important;z-index:auto!important}
 #anjun-awaiting-panel{padding:32px 24px;border:1px solid #cce7d6;border-radius:16px;background:#f8fcfa;margin:12px 0 24px}#anjun-awaiting-panel h2{font-size:20px;margin:18px 0 10px;color:#345846}#anjun-awaiting-panel p{font-size:13px;line-height:1.7;color:#727c76;max-width:540px}
 body.anjun-awaiting main>.container>:not(.mode-tabs):not(.carrier-tabs):not(#data-quality-banner):not(#anjun-awaiting-panel){display:none!important}
 body.anjun-awaiting #data-quality-banner{display:none!important}
 body.anjun-awaiting #gael-root,body.anjun-awaiting #gael-dock{display:none!important}
 .sla-clientbadge{display:inline-flex;align-items:center;justify-content:center;vertical-align:middle;position:relative;box-sizing:border-box;width:66px;height:30px;padding:4px 7px;border:1px solid #eee;border-radius:6px;background:#fff;flex-shrink:0;letter-spacing:normal;text-transform:none}
 .sla-clientmark{display:block;width:50px;height:20px;overflow:hidden;flex-shrink:0}.sla-clientbadge img{display:block;width:50px;height:20px;object-fit:contain;max-width:none}.sla-clientbadge.imile img{height:auto}
 .sla-clientbadge.jt{background:#d72e39;border-color:#d72e39}.sla-clientbadge.imile{background:#f8fcff;border-color:#d9e8f5}.sla-clientbadge.pllugo{background:#fff8f8;border-color:#f2d4d6}.sla-clientbadge.anjun{background:#f6fcf8;border-color:#cce7d6}
 .sla-clientname{position:absolute!important;width:1px!important;height:1px!important;padding:0!important;margin:-1px!important;overflow:hidden!important;clip-path:inset(50%)!important;white-space:nowrap!important}
 .carrier-tabs .tab{display:flex;align-items:center;justify-content:center;min-width:82px;min-height:46px;padding:6px 10px}.carrier-tabs .tab.active .sla-clientbadge{box-shadow:0 0 0 2px #f04a4f22}
 .carrier-tag:has(.sla-clientbadge){padding:0;background:transparent!important;line-height:1;vertical-align:middle}.hero-label,#operation-scope{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
 .tower-sub,.app-drawer-sub,.drawer-row small{line-height:2.2}.entity-name:has(.sla-clientbadge){line-height:1}.control-status-copy .sla-clientbadge,#robot-panel-body .sla-clientbadge{width:58px;height:25px;padding:3px 5px;margin:0 2px}.control-status-copy .sla-clientmark,#robot-panel-body .sla-clientmark{width:46px;height:18px}.control-status-copy .sla-clientbadge img,#robot-panel-body .sla-clientbadge img{width:46px;height:18px}.control-status-copy .sla-clientbadge.imile img,#robot-panel-body .sla-clientbadge.imile img{height:auto}
 #robot-panel{position:fixed!important;inset:12px 12px auto!important;width:auto!important;max-width:600px!important;margin:0 auto!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;box-sizing:border-box!important;z-index:2500!important;overscroll-behavior:contain}
 #robot-panel-body>div{align-items:stretch!important;gap:6px;flex-wrap:nowrap}
 #robot-panel-body>div>div{flex:0 0 auto;min-height:0}#robot-panel-body span{white-space:normal!important;overflow-wrap:anywhere}#robot-panel-body button,#robot-panel-body a{white-space:normal!important;max-width:100%}
 @media(max-width:600px){.topbar-inner{flex-wrap:wrap!important}.topbar-right{flex-wrap:wrap!important}.filters-inner{flex-wrap:wrap!important}.carrier-tabs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px}.carrier-tabs .tab{min-width:0;padding:6px 2px}.carrier-tabs .sla-clientbadge{width:100%;max-width:66px;padding:4px}}
 </style></head>`);
 await mkdir('public/modules/sla',{recursive:true});await writeFile('public/modules/sla/index.html',html);
}
if(process.argv[1]?.endsWith('build-sla.mjs'))await buildSla();
