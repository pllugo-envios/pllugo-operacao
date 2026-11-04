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
 html=html.replace(/<link[^>]+href="https:\/\/fonts\.[^>]+>/g,'');
 const csp=`<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self'; connect-src 'none'; media-src 'self' blob:; form-action 'none'; base-uri 'self' http://127.0.0.1:* https://pllugo-envios.github.io">`;
 replace('<head>','<head>'+csp);
 replace('</head>',`<style>
 #login-screen,#btn-logout,.topbar-user,.mode-tabs,#pd-root{display:none!important}
 .driver-only #pd-root{display:block!important}.driver-only main,.driver-only .filters,.driver-only #import-status-bar{display:none!important}
 header{position:relative!important;top:auto!important}.topbar-brand,.topbar .brand{display:none!important}
 .container{max-width:none!important}.topbar{padding-top:8px!important;padding-bottom:8px!important}
 body{min-width:0!important}#pd-root{margin-top:12px!important}
 @media(max-width:600px){.topbar-inner{flex-wrap:wrap!important}.topbar-right{flex-wrap:wrap!important}.filters-inner{flex-wrap:wrap!important}}
 </style></head>`);
 await mkdir('public/modules/sla',{recursive:true});await writeFile('public/modules/sla/index.html',html);
}
if(process.argv[1]?.endsWith('build-sla.mjs'))await buildSla();
