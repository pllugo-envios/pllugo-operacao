# Operação Pllugo

Rotinas operacionais, tarefas, cronograma diário e evidências das unidades Pllugo.

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

Os testes executam as 41 consultas do servidor em PostgreSQL em memória e verificam
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
