export const orderStatus=(status:any)=>status==='awaiting'?'pending':status==='resolved'?'delivered':(['assigned','delivered','pending','loss'].includes(status)?status:'pending');
export const nextOrderDay=(date:string)=>new Date(Date.parse(date+'T12:00:00Z')+86400000).toISOString().slice(0,10);
