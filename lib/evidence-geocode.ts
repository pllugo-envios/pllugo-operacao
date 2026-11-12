export async function requestEvidenceAddress(position:{latitude:number;longitude:number},request:(path:string,options?:RequestInit)=>Promise<Response>,wait:(ms:number)=>Promise<void>=ms=>new Promise(resolve=>setTimeout(resolve,ms)),timeoutMs=8000){
 for(let attempt=0;attempt<2;attempt++){
  const controller=new AbortController();let timer:ReturnType<typeof setTimeout>|undefined;
  try{
   const data=await Promise.race([(async()=>{const response=await request('/api/geocode',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({latitude:position.latitude,longitude:position.longitude}),signal:controller.signal});if(response.status===401||response.status===403)throw Error('Sua sessão expirou. Entre novamente no app.');if(response.status===429)return {limited:true};const body=await response.json().catch(()=>null);if(!response.ok||typeof body?.address!=='string'||!body.address.trim())throw Error('Endereço indisponível no momento. Atualize a localização ou registre a foto com GPS.');return {address:body.address,lines:Array.isArray(body.lines)?body.lines.filter((s:any)=>typeof s==='string'):[],attribution:body.attribution};})(),new Promise<never>((_,reject)=>{timer=setTimeout(()=>{controller.abort();reject(Error('O mapa demorou para responder. Atualize a localização ou registre a foto com GPS.'));},timeoutMs)})]);
   if('limited' in data){if(attempt===0){await wait(1500);continue;}throw Error('O mapa está ocupado. Aguarde um instante ou registre a foto com GPS.');}
   return data;
  }catch(error:any){if(error?.message?.startsWith('Sua sessão')||error?.message?.startsWith('Endereço indisponível')||error?.message?.startsWith('O mapa'))throw error;throw Error('Não foi possível consultar o endereço. Verifique a internet ou registre a foto com GPS.');}
  finally{clearTimeout(timer);controller.abort();}
 }
 throw Error('Endereço indisponível no momento.');
}
