import {readFile,writeFile,mkdir} from 'node:fs/promises';
export async function buildSla(){
 let html=await readFile('modules/sla/source.html','utf8');
 const replace=(from,to)=>{if(!html.includes(from))throw Error('SLA integration anchor changed: '+from.slice(0,80));html=html.replace(from,to)};
 replace('<script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.1"></script>','<script src="vendor/chart-4.4.1.js"></script>');
 replace('<script src="https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js"></script>','');
 replace('<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>','<script>'+await readFile('modules/sla/bridge.js','utf8')+'</script>');
 const start=html.indexOf('const SUPABASE_URL ='),end=html.indexOf('var DASH_DATA =',start);if(start<0||end<0)throw Error('SLA auth adapter anchor changed');
 html=html.slice(0,start)+`const sb=window.pllugoSlaClient;
let workbookLoading;
function ensureWorkbookLibrary(){return window.XLSX?Promise.resolve():(workbookLoading||=(new Promise((resolve,reject)=>{const script=document.createElement('script');script.src='vendor/xlsx-0.18.5.js';script.onload=resolve;script.onerror=()=>{workbookLoading=null;reject(Error('Não foi possível carregar o leitor de planilhas. Tente novamente.'))};document.head.appendChild(script)})))}
async function workbookReady(){try{await ensureWorkbookLibrary();return true}catch(e){showToast(e.message,'Planilhas');return false}}
`+html.slice(end);
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
 #robot-panel{position:fixed!important;inset:12px 12px auto!important;width:auto!important;max-width:600px!important;margin:0 auto!important;max-height:calc(100dvh - 24px)!important;overflow:auto!important;box-sizing:border-box!important;z-index:2500!important;overscroll-behavior:contain}
 #robot-panel-body>div{align-items:flex-start!important;gap:12px;flex-wrap:wrap}
 #robot-panel-body>div>div{flex:1 1 180px}#robot-panel-body span{white-space:normal!important;overflow-wrap:anywhere}#robot-panel-body button,#robot-panel-body a{white-space:normal!important;max-width:100%}
 @media(max-width:600px){.topbar-inner{flex-wrap:wrap!important}.topbar-right{flex-wrap:wrap!important}.filters-inner{flex-wrap:wrap!important}}
 </style></head>`);
 await mkdir('public/modules/sla',{recursive:true});await writeFile('public/modules/sla/index.html',html);
}
if(process.argv[1]?.endsWith('build-sla.mjs'))await buildSla();
