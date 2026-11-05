import {current,json,failure,HttpError,sameOrigin} from '../../../lib/access.ts';
import {env} from '../../../lib/runtime-env.ts';
import {compileSlaQuery,slaResult,SlaQueryError} from '../../../lib/sla-query.ts';
import {unitScope} from '../../../lib/unit-scope.ts';
async function access(req:Request){const user=await current(req);if(!unitScope(user).labels.length)throw new HttpError(403,'Seu cadastro precisa de uma unidade permitida. Solicite a vinculação ao administrador.');return user;}
export async function GET(req:Request){try{const user=await access(req);const identity=await env.slaIdentity(user);if(!identity)throw new HttpError(403,'Seu acesso ainda não está vinculado ao SLA. Solicite a vinculação ao administrador.');return json({user:identity,scope:unitScope(user)})}catch(e){return failure(e)}}
export async function POST(req:Request){try{sameOrigin(req);const user=await access(req);const query=await req.json();const identity=await env.slaIdentity(user);if(!identity)throw new HttpError(403,'Seu acesso ainda não está vinculado ao SLA.');const compiled=compileSlaQuery({...query,actorId:identity.authId,actorEmail:identity.email,operacaoActor:user.id},unitScope(user));const rows=await env.slaExecute(identity,compiled);return json(slaResult(rows,compiled))}catch(e:any){if(e instanceof SlaQueryError)return json({data:null,error:{message:e.message}},400);return failure(e)}}
