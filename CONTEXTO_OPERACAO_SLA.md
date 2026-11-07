# Contexto unificado — App Operação e SLA

Conversa principal: **Pllugo — App Operação e SLA**, ID `01a131fb-81e0-77b1-af7a-5d83e6bed060`.
Histórico complementar: **App Operação Pllugo**, ID `01a15734-48bb-7553-ad7e-16031b984a02`. Os históricos permanecem separados; este documento consolida o contexto para manter um único trabalho de desenvolvimento.

## Produto oficial e componentes

- App oficial: https://pllugo-envios.github.io/pllugo-operacao/ . Repositório `pllugo-envios/pllugo-operacao`, main, GitHub Pages.
- Módulo SLA: `modules/sla/source.html` + `scripts/build-sla.mjs`; saída `public/modules/sla/index.html`. É incorporado ao app por iframe sandbox e ponte autenticada. Não depende da URL do painel antigo para executar.
- API: Edge Function `pllugo-operacao`, Supabase `dfaoyjlzxnbephvcgkfz`. Sessão opaca do app; escopo de unidades derivado da identidade confiável, sem uma segunda sessão Supabase no iframe.
- Robô: `F:/User/Downloads/Pllugo-Automacoes` (sem git), Railway `pllugo-robo`. Ler AGENTS.md e último ESTADO_ATUAL.md. Contextos JMS separados por conta; iMile compartilha conta e trava sequencial, com estação/data verificadas.
- Painel antigo: `pllugo-envios/sla-pllugo-dashboard`. A interface pode ser retirada ou redirecionada após verificar o app oficial. O banco Supabase, o serviço Railway, o Storage e os contextos Browserbase continuam necessários. Excluir o repositório não faz parte desta transição.

## Regras e operação

- Administrador visualiza todas as unidades; Gestão/colaborador vê as unidades marcadas. Gestão com as três unidades marcadas vê as três. Preservar permissões, sessões e isolamento entre unidades.
- Não ler/imprimir configurações privadas, arquivos .env ou credenciais. CAPTCHA e código por e-mail são resolvidos pelo usuário na sessão. Não alterar o app/schema DRIVER.
- Deploy e correções em produção foram autorizados pelo usuário. Antes de publicar, verificar se há sessões de validação em andamento e preservar dados/histórico; backups de HTML ficam fora da publicação.
- Agenda dos quatro relatórios: 11h; grade de 35min ancorada às12h até23h40; extra23h55. Não deslocar a grade para11h35. Downloads novos e fingerprints evitam arquivos antigos e duplicatas.
- Última importação é distinta da última tentativa e da validação de login. A view robot_flow_status expõe last_import_at e last_report_date, mantendo security_invoker/RLS. Somente runs completed com arquivo e mensagem de importação confirmada entram nesse histórico; dry-run e login-only não contam.
- Execuções running por mais de30min são reconciliadas como interrompidas pelo worker; chamadas Supabase têm limite90s e Browserbase30s com retries limitados. Isso recupera estados órfãos, sem fingir que uma tentativa falha importou dados.

## Trabalho recente e pendências

- Origem main fe289cc inclui identidade visual das empresas e canal Anjun aguardando relatórios. Preservar essas mudanças do outro chat.
- 07/11: datas por relatório no Motor de dados; recuperação de execução iMile Mauá23h55 interrompida. Última importação anterior válida: Mauá06/11 23h41, Ribeirão06/11 23h42. Login J&T da manhã é só validação antes11h.
- Auditoria06/11: volumes/entregas/pendências/SLA e pedidos J&T fecham sem duplicidade. Pendência conhecida: parser iMile soma Upload Problem no total, mas retorna problems:0 nos motoristas (8Mauá/2RBP no instantâneo da auditoria). Não confundir essa pendência com falha de execução do robô.
- Anjun: canal preparado, integração com portal/relatórios ainda depende de especificação.
- Evitar alterações simultâneas nos dois clones/chats; sincronizar origin/main antes de editar. Clone desta conversa: work/pllugo-operacao-mobile. Clone histórico: C:/Users/User/Documents/Codex/2026-10-19/app-opera-o-pllugo-chat-este/work/operacao-pages.
