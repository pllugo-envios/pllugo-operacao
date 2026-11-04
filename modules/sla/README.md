# Integração do módulo Operação SLA

Fonte preservada: `pllugo-envios/sla-pllugo-dashboard`, commit `e86e124044a86629c5a5a9b1b3dc6d142d794492`. O site independente permanece disponível e não é alterado por esta publicação.

## Estrutura

- `lib/app-modules.ts`: registro de telas e perfis permitidos. Novos módulos devem seguir o mesmo registro, carregamento por demanda e fronteira de acesso.
- `components/app-shell.tsx`: navegação por módulos, sem misturar funções do SLA com tarefas.
- `components/sla-module.tsx`: carga separada, cancelamento ao sair, comunicação com quadro isolado sem acesso aos tokens do app.
- `modules/sla/source.html`: fonte original versionada. `scripts/build-sla.mjs` adapta somente autenticação, navegação, isolamento, carregamento de planilhas e apresentação. Os cálculos originais são preservados.
- `modules/sla/bridge.js`: compatibilidade com as consultas existentes, fila com até quatro solicitações simultâneas. Chart.js 4.4.1 e SheetJS 0.18.5 locais; SheetJS só carrega ao importar ou exportar.

## Acesso

Administrador, Supervisor e Líder de base acessam o SLA consolidado de todas as bases, conforme autorização do responsável. Usuários operacionais continuam somente com suas rotinas.

Cada chamada passa pela sessão atual, conta ativa, troca de senha obrigatória e papel no servidor. O banco executa consultas parametrizadas como `authenticated`, com contexto local da identidade e RLS existente. Não é utilizado `service_role` nas consultas SLA.

A identidade Supabase existente do proprietário é reconhecida pelo login previamente verificado no app. Contas internas recebem uma identidade de módulo separada e determinística: e-mail igual não concede identidade privilegiada de outra conta. Regras específicas de Driver e robô permanecem sob as funções/políticas existentes. Importações internas registram o usuário do app em `import_batches.metadata.operacao_actor` sem inventar uma conta Auth.

A ponte permite somente recursos e funções usados pelo SLA. SQL livre, acesso a outros schemas, remoção em massa e alterações sem filtro são rejeitados. O reset de demonstração “Limpar Dados” não está disponível na integração.

## Desempenho e limites

O SLA não carrega HTML, gráficos, planilhas ou consultas durante a abertura normal do app. O código do módulo tem chunk separado; a saída inicial comum permaneceu aproximadamente no tamanho anterior. O módulo é desmontado ao retornar às rotinas, encerrando temporizadores e requisições pendentes no navegador. Consultas SLA usam pool separado (máximo duas conexões por instância) e timeout de 20 segundos, sem ocupar a conexão das tarefas.

O histórico inicial de 95 dias e o limite de segurança de 25 mil registros da Gestão de Base são os mesmos da ferramenta de origem. Janelas grandes continuam sujeitas ao volume de dados e à rede; a indicação de leitura truncada permanece. O módulo não transforma dados incompletos em relatórios completos.

Nenhuma tabela, política, rotina ou dado histórico foi alterado na integração. Para atualizar a ferramenta de origem no futuro, comparar a fonte e executar novamente os testes de cálculo, gateway, ponte e navegação antes de publicar.
