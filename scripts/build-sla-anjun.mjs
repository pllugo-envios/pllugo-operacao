// Registers the Anjun channel in the existing SLA engine. Report parsing and
// portal credentials deliberately remain unconfigured until supplied.
export function includeAnjun(html){
 const change=(from,to)=>{if(!html.includes(from))throw Error('Anjun integration anchor changed: '+from.slice(0,90));html=html.replaceAll(from,to)};
 change('<button class="tab" data-carrier="imile">iMile</button>','<button class="tab" data-carrier="imile">iMile</button>\n      <button class="tab" data-carrier="anjun">Anjun</button>');
 change('J&T e iMile ponderados pelo volume','J&T, iMile e Anjun ponderados pelo volume');
 change('function classifyAndProcess(filename, rows) {',"function classifyAndProcess(filename, rows) {\n  if(/anjun/i.test(String(filename)))throw Error('O importador Anjun será configurado após a definição do portal e do formato dos relatórios.');");
 change('function mergePllugo(jt, imile) {','function mergePllugo(jt, imile, anjun) {');
 change('for (const src of [jt, imile])','for (const src of [jt, imile, anjun])');
 change('mergePllugo(day.jt_real || day.jt, day.imile)','mergePllugo(day.jt_real || day.jt, day.imile, day.anjun)');
 change('mergePllugo(day.jt, day.imile)','mergePllugo(day.jt, day.imile, day.anjun)');
 change('jt: null, imile: null, jt_real: null','jt: null, imile: null, jt_real: null, anjun: null');
 change("['jt', 'imile', 'jt_real']","['jt', 'imile', 'jt_real', 'anjun']");
 change('day.jt || day.imile || day.jt_real','day.jt || day.imile || day.jt_real || day.anjun');
 change('[day.jt_real || day.jt, day.imile]','[day.jt_real || day.jt, day.imile, day.anjun]');
 change("if (carrier === 'imile') return day.imile;","if (carrier === 'imile') return day.imile;\n  if (carrier === 'anjun') return day.anjun;");
 change("if ((carrier === 'pllugo' || carrier === 'imile') && day.imile) sources.push({ list: day.imile.drivers, carrier: 'iMile' });","if ((carrier === 'pllugo' || carrier === 'imile') && day.imile) sources.push({ list: day.imile.drivers, carrier: 'iMile' });\n    if ((carrier === 'pllugo' || carrier === 'anjun') && day.anjun) sources.push({ list: day.anjun.drivers || [], carrier: 'Anjun' });");
 change("if (label === 'Pllugo') return 'pllugo';","if (label === 'Pllugo') return 'pllugo';\n  if (label === 'Anjun') return 'anjun';");
 change("if (state.carrier === 'imile') return src.includes('imile');","if (state.carrier === 'imile') return src.includes('imile');\n  if (state.carrier === 'anjun') return src.includes('anjun');");
 change("if (s.includes('imile')) return 'iMile';","if (s.includes('imile')) return 'iMile';\n  if (s.includes('anjun')) return 'Anjun';");
 change("if(d.imile)sources.add('iMile');","if(d.imile)sources.add('iMile'); if(d.anjun)sources.add('Anjun');");
 change("entityCardHtml('iMile',im,'carrier:imile');","entityCardHtml('iMile',im,'carrier:imile')+entityCardHtml('Anjun',aggregate(filterHistoryPeriod(baseHist),'anjun'),'carrier:anjun');");
 change("['iMile',aggregate(filterHistoryPeriod(baseHist),'imile')]","['iMile',aggregate(filterHistoryPeriod(baseHist),'imile')],['Anjun',aggregate(filterHistoryPeriod(baseHist),'anjun')]");
 change("jt_real: 'J&T' }","jt_real: 'J&T', anjun: 'Anjun' }");
 change("addSource(day.imile, 'iMile');","addSource(day.imile, 'iMile');\n  addSource(day.anjun, 'Anjun');");
 change("if (state.carrier === 'imile') return d.carrier === 'iMile';","if (state.carrier === 'imile') return d.carrier === 'iMile';\n  if (state.carrier === 'anjun') return d.carrier === 'Anjun';");
 change("driver.carrier==='iMile'?'imile':'pllugo'","driver.carrier==='iMile'?'imile':driver.carrier==='Anjun'?'anjun':'pllugo'");
 change('function refresh() {',`function refresh() {
  const waiting=state.carrier==='anjun'&&!filteredHistory().some(day=>day.anjun);
  document.body.classList.toggle('anjun-awaiting',waiting);
  const placeholder=document.getElementById('anjun-awaiting-panel');if(placeholder)placeholder.hidden=!waiting;
  if(waiting){document.getElementById('window-info').textContent='—';document.getElementById('day-count').textContent='0';return;}`);
 change('async function refreshBaseKnowledge(force = false) {',"async function refreshBaseKnowledge(force = false) {\n  if(state.carrier==='anjun'&&!filteredHistory().some(day=>day.anjun))return;");
 change('<div class="hero" id="hero-section">','<section id="anjun-awaiting-panel" hidden aria-live="polite"><h2>Aguardando dados da Anjun</h2><p>O canal está preparado para receber os relatórios. Nenhum dado foi importado para esta unidade e período.</p></section>\n    <div class="hero" id="hero-section">');
 return html;
}
