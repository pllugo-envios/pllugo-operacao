import {formatGeocode} from './geocode-format.ts';
function distance(latitude:number,longitude:number,coordinates:any){if(!Array.isArray(coordinates)||!coordinates.slice(0,2).every(Number.isFinite))return Infinity;const r=Math.PI/180;return Math.hypot((coordinates[0]-longitude)*r*Math.cos(latitude*r),(coordinates[1]-latitude)*r)*6371000;}
export async function providerAddress(latitude:number,longitude:number,request:typeof fetch=fetch){
 const photon=new URL('https://photon.komoot.io/reverse');photon.search=new URLSearchParams({lat:String(latitude),lon:String(longitude),limit:'5',radius:'0.2'}).toString();photon.searchParams.append('layer','house');photon.searchParams.append('layer','street');
 const nominatim=new URL('https://nominatim.openstreetmap.org/reverse');nominatim.search=new URLSearchParams({format:'jsonv2',lat:String(latitude),lon:String(longitude),zoom:'18',layer:'address',addressdetails:'1','accept-language':'pt-BR'}).toString();
 let fallback:any=null;
 for(const [provider,url,timeout] of [['photon',photon,3500],['nominatim',nominatim,2500]] as const){try{
  const response=await request(url,{headers:{'User-Agent':'PllugoOperacao/1.3 (https://pllugo-envios.github.io/pllugo-operacao/)'},signal:AbortSignal.timeout(timeout)});if(!response.ok){await response.body?.cancel();console.info('geocode-provider',provider,response.status);continue;}
  const data=await response.json();
  if(provider==='nominatim'){const address={...data.address};const numbered=!!address.house_number&&distance(latitude,longitude,[Number(data.lon),Number(data.lat)])<=35;if(!numbered)delete address.house_number;const result=formatGeocode({...data,address});if(result.address){if(numbered)return {...result,provider};fallback??={...result,provider};}}
  else{const features=(Array.isArray(data.features)?data.features:[]).filter((f:any)=>f.properties?.street||f.properties?.type==='street').sort((a:any,b:any)=>distance(latitude,longitude,a.geometry?.coordinates)-distance(latitude,longitude,b.geometry?.coordinates));const numbered=features.find((f:any)=>f.properties.housenumber&&distance(latitude,longitude,f.geometry?.coordinates)<=35);const feature=numbered||features[0];if(feature){const p=feature.properties,result=formatGeocode({address:{road:p.street||(p.type==='street'?p.name:''),house_number:numbered?p.housenumber:undefined,suburb:p.district||p.locality,city:p.city,state:p.state}});if(result.address){if(numbered)return {...result,provider};fallback={...result,provider};}}}
 }catch{console.info('geocode-provider',provider,'unavailable');}}
 return fallback;
}
