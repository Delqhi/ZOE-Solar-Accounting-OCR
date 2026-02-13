# PROJECT_KNOWLEDGE.md
**Persistent Context Storage** | **Manus Pattern** | **2026-01-10**

## 🎯 Project Identity
**Name:** zoe-solar-accounting-ocr
**Root:** /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr
**Initialized:** 2026-01-10T11:06:13.170Z

## 🏗️ Architecture Snapshot
```
belege-uploads, docs, e2e, oci-ssh-keys, src, wiki
```

## 🧩 Component Registry
- lint-staged.config.js
- playwright.config.ts
- vite.config.ts
- vitest.config.ts
- vitest.setup.ts

## 🔗 Dependencies
- @google/genai
- @supabase/supabase-js
- @types/uuid
- autoprefixer
- jspdf
- jspdf-autotable
- pdfjs-dist
- react
- react-dom
- react-hot-toast
- uuid

## 📚 Documentation Links
- [AGENTS.md](./AGENTS.md) - Repository context
- [todo.md](./todo.md) - Task management
- [CLAUDE.md](./CLAUDE.md) - Global config

## 🎨 Design Patterns
- TypeScript: Strong typing

- Node.js: Backend runtime

## 📊 Metrics
**Files:** 19
**Directories:** 6
**Tech Stack Items:** 4

## 🔄 Update Log
2026-01-10T11:06:13.170Z - Initial knowledge base created
2026-01-10T21:47:00.000Z - Supabase secrets documented in SUPABASE_SECRETS.md

## 🔐 Supabase Infrastructure
**URL:** https://supabase.aura-call.de
**Studio:** https://studio.aura-call.de
**Status:** ✅ Active
**Documentation:** [SUPABASE_SECRETS.md](../SUPABASE_SECRETS.md)

### Key Variables (Secure Storage):
- `NEXT_PUBLIC_SUPABASE_URL` - API Endpoint
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Frontend Key
- `SUPABASE_SERVICE_ROLE_KEY` - Backend Admin Key
- `SUPABASE_JWT_SECRET` - Token Validation
- `SUPABASE_DB_PASSWORD` - Database Password
- `DATABASE_URL` - Direct PostgreSQL Connection

### Database Structure:
- Primary DB: postgres
- Tables: channels, channel_workflows, projects, team_secrets, auth.users
- Users: postgres (superuser), supabase_auth_admin, supabase_storage_admin

### Docker Services:
- Container: ngze-techstack-supabase-db-1
- Services: supabase-db, postgrest, kong, supabase-studio
- Kong Dashboard: http://localhost:8081 (admin / Ngz3C0nTr0llD4sh2026!)

---
*This file persists across sessions*
*Update after major architectural changes*
