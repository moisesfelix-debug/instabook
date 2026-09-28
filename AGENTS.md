# Instructions for coding agents

Project: InstaBook

Goal: SaaS for AI-assisted Instagram content planning, creation, approval, scheduling, publishing and analytics. Must support individual subscribers and agency workspaces in the same product.

Non-negotiables:
- Multi-tenant architecture from day one.
- Never query tenant-owned data without workspace authorization.
- TypeScript strict mode.
- Prefer server-side secrets and server actions/route handlers for privileged operations.
- Keep UI modern, clean and productivity-oriented; avoid cloning Posttar branding/assets.
- Content editor must evolve from structured templates before attempting a freeform Canva clone.
- Instagram publishing must use official Meta APIs.

Before substantial changes read: PRODUCT.md, ARCHITECTURE.md, DATABASE.md, ROADMAP.md.

When completing work:
1. update ROADMAP.md;
2. document architectural decisions;
3. run typecheck/build/tests;
4. do not commit secrets.
