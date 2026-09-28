# InstaBook — Decisions

## 2026-09-28 — Multi-tenant from day one
Every business entity is scoped to a workspace. Users join workspaces through memberships and roles.

## 2026-09-28 — One product for SaaS + agency use
Individual users, freelancers and agencies use the same product core. Agency-specific capabilities are unlocked through workspace type, roles and plan limits.

## 2026-09-28 — Next.js + Supabase + Vercel
Next.js is the application layer, Supabase provides PostgreSQL/Auth/Storage, and Vercel hosts the application.

## 2026-09-28 — RLS is mandatory
Tenant isolation is enforced in PostgreSQL Row Level Security, not only in application UI or API code.

## 2026-09-28 — Structured content editor first
Carousels start from structured templates and slide payloads. A fully freeform Canva-like editor is not an MVP requirement.

## 2026-09-28 — Instagram first
Initial social publishing scope is Instagram through official Meta APIs.


## 2026-09-28 — Supabase production foundation
The production Supabase project runs in sa-east-1 (São Paulo). Initial tenant data is isolated with RLS. Public create_workspace is SECURITY INVOKER; SECURITY DEFINER helpers live in a private schema with restricted execution.

## 2026-09-28 — Public Supabase settings can bootstrap the frontend
The project URL and publishable key may be used client-side because authorization is enforced by RLS. Environment variables remain the preferred long-term configuration.
