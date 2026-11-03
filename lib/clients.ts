export const CLIENTS=['J&T','iMile','Pllugo','Anjun'] as const;
export const clientSlug=(client:string)=>({'J&T':'jt',iMile:'imile',Pllugo:'pllugo',Anjun:'anjun'} as Record<string,string>)[client]||'';
export const clientLogo=(client:string)=>clientSlug(client)?'/brands/'+clientSlug(client)+(client==='Anjun'?'.svg':'.png'):'';
