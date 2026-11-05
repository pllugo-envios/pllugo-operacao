// Module navigation is the shared registry for menus, restored views and access.
export const SLA_VIEWS=[['SLA:geral','Visão Geral'],['SLA:operacao','Visão Operação'],['SLA:torre','Torre de Controle'],['SLA:base','Gestão de Base'],['SLA:driver','Operação Driver']] as const;
export const isSlaView=(view:string)=>SLA_VIEWS.some(([key])=>key===view);
export const canSla=(user:any)=>['Administrador','Supervisor','Líder de base','Assistente'].includes(user?.role);
export const slaLabel=(view:string)=>SLA_VIEWS.find(([key])=>key===view)?.[1]||'Operação SLA';

export const slaViewsFor=(user:any)=>SLA_VIEWS.filter(([key])=>key!=='SLA:driver'||user?.role==='Administrador');
