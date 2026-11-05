# Operação Pllugo

Rotinas operacionais, tarefas, cronograma diário e evidências das unidades Pllugo.

## Atualização da versão 12

Origem: Sites v12, commit 49098e2032951ba5a54f20ef3f51ee0f4f5f2cd5.
Painel Início por unidade, menu compacto, busca de atividades e criação unificada
para um ou dois clientes. Instruções numeradas substituem o checklist de execução;
campos obrigatórios e evidências continuam validados pelo servidor. Criações
repetidas são idempotentes. Mantidos instalação, Copiar acesso e atribuições v11.

## Responsabilidades e acompanhamento

As atualizações da versão 11 do app original foram adaptadas para este ambiente:
responsabilidade fixa com início de vigência, substituição temporária inclusiva
com retorno automático ao titular, Minhas tarefas, filtros por colaborador e
agrupamento visual de atividades por cliente. Cada cliente continua mantendo
suas próprias evidências e conclusão. Tarefas concluídas não são reatribuídas.

O backend aplica o plano de atribuição antes de verificar acesso às tarefas e
fotos. Alterações de plano usam uma transação PostgreSQL com bloqueio da revisão
atual; conflitos retornam 409 para evitar sobrescrever alterações de outro acesso.
Não houve migração ou substituição dos registros operacionais existentes.

## Publicação

Interface estática no GitHub Pages, seguindo o padrão do dashboard SLA. O workflow
`.github/workflows/pages.yml` testa, compila e publica `dist/` a partir de `main`.
Endereço previsto: `https://pllugo-envios.github.io/pllugo-operacao/`.

Os serviços ficam na Edge Function `pllugo-operacao`, no projeto Supabase existente
`sla-pllugo`. PostgreSQL usa o schema exclusivo `operacao`; fotos ficam no bucket
privado `operacao-evidencias`. Não é necessário um servidor Railway.

## Instalação no celular

No celular, uma única tela de instalação aparece antes do acesso. Quando o Chrome
oferece a instalação nativa, o botão **Instalar** abre a confirmação do navegador.
Sem essa oferta, a tela informa o caminho no menu. No iPhone, o Safari exige
Compartilhar → Adicionar à Tela de Início. A página não pode instalar sem a
confirmação do sistema. Ao abrir pelo ícone instalado, o acesso é liberado.
No computador, os controles de instalação não aparecem. O manifest e o service
worker se limitam a `/pllugo-operacao/`, preservando os outros aplicativos
publicados na mesma conta GitHub Pages.

As tarefas e as fotos precisam de conexão. O service worker não guarda respostas
da API, fotos, senhas ou registros operacionais em cache.

## Acesso e dados

O link `https://pllugo-envios.github.io/pllugo-operacao/acesso/` pode ser
compartilhado no WhatsApp. No Chrome/Android, continua direto para o app; em
navegadores internos oferece um link Android Intent para abrir o Chrome. O sistema
pode exigir um toque ou confirmação para sair do WhatsApp. No iPhone, a página
orienta o uso do Safari. O destino é fixo e não recebe credenciais na URL.

Em Equipe, administradores podem usar **Copiar acesso** para copiar uma mensagem
personalizada com nome, login, senha provisória e instruções. A senha provisória
recém-gerada fica somente na memória da sessão administrativa. Senhas pessoais
não são recuperáveis. Sem uma senha provisória disponível, o administrador precisa
confirmar **Gerar senha e copiar**, que redefine a senha e revoga as sessões
anteriores. Falhas de permissão da área de transferência deixam a mensagem
selecionável para cópia manual. Não há envio automático pelo WhatsApp.

- Usuários existentes mantêm os papéis, unidades, atribuições e senhas do Operação.
- Uma conta cadastrada no Operação que ainda não possui senha local pode entrar
  com seu acesso Supabase já existente, desde que o e-mail tenha sido confirmado.
  Isso permite ao proprietário usar seu acesso do SLA. Nenhum cadastro é promovido
  automaticamente por ter uma conta Supabase.
- As sessões aleatórias são verificadas no servidor, guardadas como hash no banco
  e expiram em 12 horas. Persistência no aparelho exige marcar a opção no login.
- As fotos são carregadas pela API autenticada. Não há bucket público nem token
  de acesso em links de imagem. Cada ação continua verificando papel e unidade.
- O frontend não recebe credenciais administrativas. As variáveis `SUPABASE_DB_URL`
  e `SUPABASE_SERVICE_ROLE_KEY` são obtidas do ambiente privado da Edge Function.
- Dados de usuários, hashes de senhas, exportações e evidências não pertencem a
  este repositório nem ao pacote de publicação do Pages.

## Desenvolvimento e validação

Use Node.js 24:

```sh
npm ci
npm test
npm run typecheck
npm run build
```

Os testes executam as 48 consultas do servidor em PostgreSQL em memória e verificam
os fluxos de tarefas, recorrência, permissões por usuário/unidade, atribuição,
proteção de fotos, imutabilidade de conclusão e revogação de sessões. Também
verificam CORS e o transporte autenticado entre Pages e Supabase.

O schema ativa RLS e bloqueia acesso direto por `anon` e `authenticated`. As APIs
aplicam a autorização de negócio antes de acessar dados ou armazenamento. Uma
política restritiva impede que permissões antigas de Storage tornem público o
novo bucket. As tabelas do SLA e do Drive não são alteradas.

## Implantação do backend

A migration em `supabase/migrations/` deve ser aplicada uma vez ao schema ainda
inexistente. A Edge Function usa `supabase/functions/pllugo-operacao/index.ts` e
o `deno.json` incluído. `verify_jwt = false` é intencional: a função usa suas
próprias sessões opacas e valida a identidade e as permissões em cada rota.

O backend está implantado. A cópia final preservou os 369 registros, 7 usuários e
41 evidências do app original. Todas as imagens foram comparadas por SHA-256;
os metadados permanecem privados no banco. A publicação do Pages deve ser
confirmada no resultado do workflow antes de divulgar o endereço definitivo.

## Referências

- [GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages)
- [Segredos das Edge Functions](https://supabase.com/docs/guides/functions/secrets)
- [Supabase Storage](https://supabase.com/docs/guides/storage)

## Permissões por unidade — Operação e SLA

Colaboradores e Gestão consultam somente as unidades marcadas no cadastro. Uma,
duas ou três unidades são permitidas; Gestão com as três marcadas vê as três.
Administrador tem acesso a todas, independentemente das marcações. Cadastros e
atribuições existentes são preservados.

O gateway calcula o escopo a partir da sessão validada, ignorando permissões
enviadas pelo navegador. No SLA, aplica o recorte às linhas de pedidos, ao JSON
por unidade, aos totais, aos motoristas e às fotografias da Torre antes de devolver
a resposta. Dados históricos sem unidade identificada ficam fora da consulta
restrita. Mauá Unidade 2 usa a chave própria `maua2`; não herda os dados da Unidade 1.

A consulta de SLA é liberada também ao nível Operacional. Escritas em agregados
compartilhados, notas globais da Torre, integração Driver e controle do robô
continuam restritos à administração; não se salvam fotografias parciais sobre
as fotografias gerais. As permissões pessoais das tarefas permanecem vigentes.
Não foi necessário alterar RLS, schema, contas ou automações de importação.

## Início e navegação

A tela Início apresenta o mês vigente em Brasília: volume dos relatórios diários,
entregas registradas, taxa ponderada e dias com dados. A seleção do mês é automática;
a tela reconsulta os dados a cada minuto e ao retornar ao app, respeitando o escopo
de unidades do gateway SLA. J&T oficial substitui a prévia por dia/unidade; não se
somam os dois. Os volumes acumulados não representam pedidos únicos do mês.

A antiga tela inicial fica em **Rotina e evidências → Visão Geral**. A ordem do
menu é Início, Operação SLA, Rotina e evidências, Cadastros e Configuração. Todos
os grupos começam fechados a cada abertura do menu. Cadastros reúne Tarefas e
rotinas e Equipe, conforme o nível de acesso. O fechamento manual da unidade foi
retirado da interface, preservando os registros históricos. Configuração reúne
perfil, unidades autorizadas, explicação de permissões e os atalhos administrativos
já disponíveis; não simula controles futuros nem altera acessos automaticamente.

O resumo mensal usa a projeção compacta `summary: monthly` do gateway SLA: retorna
somente totais por unidade e datas, sem transportar pedidos ou motoristas para a
tela inicial. O recorte de unidades é aplicado antes dessa projeção.

Operação da publicação: caso uma publicação exceda o timeout do runner, o Pages
pode manter a implantação pendente no serviço. Nessa situação é necessário
cancelar a implantação no Pages antes de repetir a publicação; não basta repetir
o job do Actions. A versão publicada anteriormente permanece disponível.
