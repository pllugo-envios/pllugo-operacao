// Shared, escaped markup for the isolated SLA document. The catalog is supplied
// by the build from the same client logos used by React's ClientBadge.
export function createBrandMarkup(catalog:Record<string,{slug:string,logo:string}>){
 return function brandMarkup(value:unknown){
  const text=String(value??''),escape=(s:string)=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]!));
  const key=text.trim().toLowerCase(),alias:Record<string,string>={jt:'j&t',jt_real:'j&t'},name=Object.keys(catalog).find(name=>name.toLowerCase()===(alias[key]||key));
  if(!name)return escape(text);
  const {slug,logo}=catalog[name];
  return '<span class="sla-clientbadge '+escape(slug)+'" title="'+escape(name)+'"><span class="sla-clientmark"><img src="'+escape(logo)+'" alt="'+escape(name)+'" width="50" height="20" loading="lazy" decoding="async"></span><span class="sla-clientname" aria-hidden="true">'+escape(name)+'</span></span>';
 };
}
