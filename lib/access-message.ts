export const ACCESS_URL='https://pllugo-envios.github.io/pllugo-operacao/acesso/';
const line=(value:string)=>value.replace(/[\r\n\t*_*~`]/g,' ').replace(/\s+/g,' ').trim();
export function accessMessage(person:{name:string,email:string},temporary:string){
  return `Olá, *${line(person.name)}*! 👋\nBem-vindo(a) ao *Operação Pllugo*, nosso app de rotinas e evidências.\n\n📲 ${ACCESS_URL}\n*Login:* ${person.email.replace(/[\r\n\t]/g,'').trim()}\n*Senha provisória:* ${temporary}\n\nInstale e abra pelo ícone *Pllugo Operação*. No primeiro acesso, crie sua nova senha.\nAndroid: use o Chrome. iPhone: use o Safari.\n\nConte com a equipe Pllugo!`;
}
