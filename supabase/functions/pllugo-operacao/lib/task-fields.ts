export const isObservationField=(field:string)=>/^observac(?:ao|oes)$/i.test(field.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim());
export function executionFields(task:any):string[]{const fields:string[]=task.fields||[];if(task.observationEnabled===false)return fields.filter(f=>!isObservationField(f));return fields.some(isObservationField)?fields:[...fields,'Observação'];}
