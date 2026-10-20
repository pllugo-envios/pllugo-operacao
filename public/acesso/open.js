// Fixed destination: no credentials or arbitrary redirects in this link.
const destination='https://pllugo-envios.github.io/pllugo-operacao/';
const ua=navigator.userAgent;
const android=/Android/i.test(ua);
const ios=/iPhone|iPad|iPod/i.test(ua)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;
const embedded=/; wv\)|FBAN|FBAV|Instagram|WhatsApp|GSA|GoogleApp|ChatGPT/i.test(ua);
const chrome=/Chrome\//.test(ua)&&!embedded&&!/EdgA|OPR|SamsungBrowser/i.test(ua);
const open=document.getElementById('open');
if(standalone||(!android&&!ios)||(android&&chrome)){location.replace(destination)}
else if(android){
 open.href='intent://pllugo-envios.github.io/pllugo-operacao/#Intent;scheme=https;package=com.android.chrome;S.browser_fallback_url='+encodeURIComponent(destination)+';end';
 open.textContent='Abrir no Chrome';
 document.getElementById('instructions').textContent='Abra no Chrome para instalar o aplicativo.';
 document.getElementById('help').textContent='Se o WhatsApp não abrir o Chrome, use o menu ⋮ → Abrir no navegador.';
}else{
 open.href=destination;open.textContent='Continuar para instalar';
 document.getElementById('instructions').textContent='No iPhone, abra este link no Safari. Toque em Compartilhar → Adicionar à Tela de Início.';
 document.getElementById('help').textContent='Se estiver no WhatsApp, use o menu da conversa para abrir o link no navegador.';
}
