export function validMobilePath(path:unknown):path is string {
 return typeof path==='string' && (path==='/claim'||/^\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}\/(frame(?:\/(?:full|focus))?|input|leave)$/.test(path));
}
export async function forwardMobileControl(payload:any,request:(path:string,body?:any)=>Promise<Response>){
 if(!payload||!validMobilePath(payload.path)||JSON.stringify(payload.body??null).length>16000)throw Error('Controle inválido.');
 if(/\/frame(?:\/(?:full|focus))?$/.test(payload.path)&&payload.body!==undefined)throw Error('Imagem inválida.');
 const response=await request(payload.path,payload.body);
 const type=response.headers.get('content-type')||'application/json';
 if(type!=='image/jpeg'&&!type.startsWith('application/json'))throw Error('Resposta de controle inválida.');
 const body=await response.arrayBuffer();
 if(body.byteLength>2*1024*1024)throw Error('Imagem acima do limite.');
 return {mobileResponse:{status:response.status,contentType:type,body,rect:response.headers.get('X-Control-Rect')}};
}
