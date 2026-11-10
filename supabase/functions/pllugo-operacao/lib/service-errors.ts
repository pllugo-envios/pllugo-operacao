const transientCodes=new Set(['CONNECT_TIMEOUT','CONNECTION_CLOSED','CONNECTION_ENDED','ECONNRESET','ECONNREFUSED','ETIMEDOUT','57P01','57P02','57P03','53300']);
export function temporaryDatabaseError(error:any){return transientCodes.has(String(error?.code||''))||/connection (?:terminated|closed|timeout)|connect_timeout|not accepting connections/i.test(String(error?.message||''));}
export const unavailableMessage='O servidor está temporariamente indisponível. Aguarde um instante e tente novamente. Seu acesso salvo foi preservado.';
