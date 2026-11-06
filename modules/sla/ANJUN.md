# Canal Anjun no app

O canal está registrado com a logomarca oficial já usada nas rotinas. Visão Geral, Visão Operação, filtros de pedidos, tracking, motoristas, Torre de Controle e consolidação Pllugo reconhecem a fonte `anjun`. O início diário e mensal também a reconhece. As permissões por unidade continuam as mesmas.

Sem relatórios da Anjun no período/unidade, a interface informa que está aguardando dados. Não exibe SLA zero, alertas de atraso fictícios ou o indicador Gael do cliente anteriormente selecionado. Consultas de Gestão de Base desnecessárias são evitadas nessa situação.

## Alimentação futura

O portal, os acessos, os relatórios e o importador não foram configurados nesta etapa, conforme solicitado. Nenhum robô Anjun foi criado e nenhum dado foi inventado. Relatórios identificados como Anjun não passam pelo classificador de J&T/iMile.

Antes de ativar a integração, confirmar formato/colunas, data operacional, unidade, identificação de motoristas, regra contratual de SLA, exclusões, meta e atualização esperada.

O contrato existente do SLA foi preparado para:

- `sla_days`: `source='anjun'`, `date` em YYYY-MM-DD, `total`, `entregues`, `pendentes`, `problematicos`, `sla` e `by_unit`.
- `by_unit`: somente unidades reais (`maua`, `maua2`, `rbp`), com os totais e `drivers` da respectiva unidade. É necessário para visibilidade correta nos acessos restritos.
- `sla_drivers`: chave `(date,source,driver_name)`, totais e ocorrências da própria fonte.
- Pedidos e eventos granulares: `source='anjun'`, chaves e horários reais, sem reaproveitar os registros de outro cliente.

A configuração aditiva das constraints está em `scripts/sql/enable-anjun-sla.sql`, aplicada pelo histórico de migrations do Supabase como `enable_anjun_sla_channel`. As chaves de unicidade e as políticas de acesso foram preservadas. Dados existentes foram conferidos antes/depois da alteração.
