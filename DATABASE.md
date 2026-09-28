# InstaBook — Database v0

## Tabelas fundamentais

### users
Perfil complementar ao provedor de autenticação.

### workspaces
`id`, `name`, `type` (creator|professional|agency), `owner_user_id`, `created_at`.

### workspace_members
`workspace_id`, `user_id`, `role` (owner|admin|strategist|creator|reviewer|client).

### clients
Opcional. Usado principalmente em workspaces agency/professional.

### brands
`workspace_id`, `client_id?`, `name`, `segment`, `audience`, `tone`, `website`, `logo_url`.

### brand_guidelines
Cores, fontes, palavras preferidas/proibidas, CTA padrão, voz e exemplos.

### social_accounts
Marca + rede + identificadores externos + credenciais seguras.

### contents
`workspace_id`, `brand_id`, `type`, `title`, `caption`, `status`, `objective`, `scheduled_at`, `created_by`.

### content_slides
`content_id`, `position`, `template_id`, `payload_json`.

### templates
Estrutura visual reutilizável por formato.

### approvals
`content_id`, `requested_from_user_id`, `status`, `decided_at`.

### scheduled_posts
Fila lógica da publicação.

### ai_generations
Prompt, modelo, uso, custo aproximado, resultado estruturado e referência ao conteúdo.

### analytics_daily
Métricas agregadas por conteúdo/conta/dia.

### subscriptions / usage_events
Plano, ciclo, limites e consumo.
