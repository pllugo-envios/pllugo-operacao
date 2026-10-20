const ALLOWED_ORIGIN='https://pllugo-envios.github.io';
const SESSION=/^[a-f0-9]{64}$/;
type Handler=(req:Request)=>Promise<Response>;
type Routes=Record<string,Partial<Record<string,Handler>>>;

export function createHandler(routes:Routes){return async(request:Request)=>{
  const origin=request.headers.get('origin');
  if(origin&&origin!==ALLOWED_ORIGIN)return new Response('Origem não autorizada.',{status:403});
  const cors:Record<string,string>={'Vary':'Origin','Cache-Control':'no-store',
    'Access-Control-Allow-Methods':'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':'authorization, content-type',
    'Access-Control-Expose-Headers':'X-Pllugo-Session'};
  if(origin)cors['Access-Control-Allow-Origin']=origin;
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers:cors});
  const incoming=new URL(request.url);
  const marker='/pllugo-operacao';
  const index=incoming.pathname.indexOf(marker);
  const path=index>=0?incoming.pathname.slice(index+marker.length):'';
  const handler=routes[path]?.[request.method];
  if(!handler)return new Response('Serviço não encontrado.',{status:404,headers:cors});
  const headers=new Headers(request.headers);
  // Browser-supplied cookies and ChatGPT/proxy headers never grant access here.
  for(const key of [...headers.keys()])if(key.startsWith('oai-')||key==='cookie'||key==='cf-connecting-ip')headers.delete(key);
  const bearer=/^Bearer (.+)$/i.exec(headers.get('authorization')||'')?.[1];
  if(bearer&&SESSION.test(bearer))headers.set('cookie',`pllugo_session=${bearer}`);
  headers.delete('authorization');
  let body:Uint8Array|undefined;
  if(!['GET','HEAD'].includes(request.method)&&request.body){
    const reader=request.body.getReader(),chunks:Uint8Array[]=[];
    const limit=path==='/api/photo'?9*1024*1024:1024*1024;let length=0;
    while(true){const next=await reader.read();if(next.done)break;length+=next.value.length;
      if(length>limit){await reader.cancel();return new Response('Envio acima do limite.',{status:413,headers:cors})}chunks.push(next.value)}
    body=new Uint8Array(length);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.length}
  }
  try{
    const req=new Request(ALLOWED_ORIGIN+'/pllugo-operacao'+path+incoming.search,{method:request.method,headers,body});
    const response=await handler(req);
    const outputHeaders=new Headers(response.headers);
    // Translate the existing secure cookie session into an opaque bearer session.
    // Only login/password/logout responses can mint or revoke it.
    const cookie=outputHeaders.get('set-cookie')||'';
    const match=/(?:^|,\s*)pllugo_session=([a-f0-9]*)/.exec(cookie);
    if(match&&path==='/api/auth'&&request.method==='POST')outputHeaders.set('X-Pllugo-Session',match[1]);
    outputHeaders.delete('set-cookie');
    for(const [key,value] of Object.entries(cors))outputHeaders.set(key,value);
    outputHeaders.set('X-Content-Type-Options','nosniff');
    return new Response(response.body,{status:response.status,headers:outputHeaders});
  }catch{return new Response('Não foi possível concluir a operação.',{status:500,headers:cors})}
}}
