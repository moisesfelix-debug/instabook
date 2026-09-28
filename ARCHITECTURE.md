# InstaBook — Architecture

## Stack alvo
- Next.js + TypeScript
- PostgreSQL / Supabase
- Supabase Auth
- Supabase Storage ou Cloudflare R2
- Vercel
- OpenAI para geração estruturada de conteúdo
- Meta Graph API para Instagram
- Scheduler/queue: Vercel Queues/Cron, Inngest ou Trigger.dev (decisão na etapa de publicação)
- Billing: Stripe ou Mercado Pago (decisão antes da monetização)

## Multi-tenancy
Toda entidade de negócio deve ser alcançável por `workspace_id`. A autorização nunca deve depender apenas de IDs enviados pelo cliente.

## Domínios principais
- identity: users, workspaces, memberships, roles
- brands: clients, brands, brand_guidelines, social_accounts
- content: contents, content_versions, slides, media_assets, templates
- workflow: approvals, comments, scheduled_posts, publishing_jobs
- intelligence: ai_generations, analytics_daily, content_insights, topic_ideas
- commercial: plans, subscriptions, usage_events

## Segurança
- RLS no Supabase por workspace/membership.
- Tokens da Meta criptografados no servidor.
- Secrets exclusivamente server-side.
- Auditoria de ações críticas de publicação/aprovação.
