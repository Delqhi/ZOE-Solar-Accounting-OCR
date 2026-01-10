# 🔐 GLOBAL INFRASTRUCTURE & SECRET MANAGEMENT

**Version:** 1.0 | **Last Updated:** 2026-01-09

---

## 🎯 SECRET STORAGE LOCATIONS

### 1. Global (Source of Truth)
```bash
~/.claude/DOCUMENTATION/GLOBAL_INFRASTRUCTURE.md  # ← This file
```

### 2. Environment Variables (Runtime)
```bash
~/.claude/settings.json  # ← Claude Code settings
```

### 3. Vercel Environments (Sync Target)
- PRODUCTION
- PREVIEW
- DEVELOPMENT

### 4. Supabase (Database)
- Table: `app_secrets` or `credentials`
- Columns: `key`, `value`, `environment`, `project_id`

---

## 🔑 CURRENT API KEYS

### OpenCode Zen API
- **Key:** `OPENCODE_API_KEY`
- **Purpose:** OpenCode CLI with GLM 4.7 models
- **Format:** `opencode/glm-4.7`
- **Base URL:** `https://api.opencode.ai`
- **Status:** ✅ Configured in opencode.json

### Mimo API (Claude Code)
- **Key:** `ANTHROPIC_API_KEY`
- **Purpose:** Claude Code with mimo-v2-flash model
- **Base URL:** `https://api.xiaomimimo.com/anthropic`
- **Status:** ✅ Configured in settings.json

### Tavily API
- **Key:** `TAVILY_API_KEY`
- **Purpose:** Web search and research
- **Status:** ✅ Configured in .claude.json

### YouTube API
- **Key:** `YOUTUBE_API_KEY`
- **Purpose:** YouTube data and transcripts
- **Status:** ✅ Configured in .claude.json

### Skyvern API
- **Key:** `SKYVERN_API_KEY`
- **Purpose:** Browser automation
- **Status:** ✅ Configured in .claude.json

---

## 🔄 SYNC WORKFLOW

### Automatic Sync (via /start)
```bash
node ~/.claude/EXECUTORS/config-sync.js
```

### What Gets Synced:
1. Global configs → Project configs
2. Environment variables → Vercel
3. API keys → Supabase
4. MCP servers → All environments

### Manual Sync Commands:
```bash
# To Vercel
vercel env add OPENCODE_API_KEY
vercel env add ANTHROPIC_API_KEY
vercel env add TAVILY_API_KEY

# To Supabase
supabase secrets set OPENCODE_API_KEY="your-key"
supabase secrets set ANTHROPIC_API_KEY="your-key"
```

---

## 🛡️ SECURITY BEST PRACTICES

### 1. Never Commit Secrets
- ✅ Use environment variables
- ✅ Use .env files (gitignored)
- ✅ Use secret management services
- ❌ Never commit to git
- ❌ Never share in logs
- ❌ Never hardcode

### 2. Environment Hierarchy
```
~/.claude/settings.json (User)
→ PROJECT/.claude/settings.local.json (Local override)
→ PROJECT/.env (Project-specific)
→ System environment (Runtime)
```

### 3. Rotation Policy
- Rotate API keys every 90 days
- Rotate immediately if leaked
- Use different keys for dev/prod
- Monitor usage patterns

### 4. Access Control
- Read-only access for CI/CD
- Separate keys per service
- Principle of least privilege
- Audit logs enabled

---

## 🚨 EMERGENCY PROCEDURES

### If API Key is Leaked:
1. **Immediate:** Regenerate key in provider dashboard
2. **Update:** Run `node ~/.claude/EXECUTORS/setup-secrets.js`
3. **Sync:** Update all environments
4. **Audit:** Check usage logs for unauthorized access

### If Configuration is Corrupted:
1. **Backup:** Check `~/.claude/CONFIGS/` for backups
2. **Restore:** Use `node ~/.claude/EXECUTORS/config-sync.js`
3. **Verify:** Run health check
4. **Document:** Update this file

---

## 📊 MONITORING

### Check Current Secrets:
```bash
# View current configuration
cat ~/.claude/settings.json | grep -i key
cat ~/.claude/opencode.json | grep -i key
cat ~/.claude/.claude.json | grep -i key
```

### Validate Setup:
```bash
node ~/.claude/EXECUTORS/setup-health.js
```

---

**Last Verified:** 2026-01-09
**Status:** ✅ All secrets properly configured
