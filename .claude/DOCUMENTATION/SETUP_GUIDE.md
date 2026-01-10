# 🚀 SETUP GUIDE - MASTER DEVELOPER LOOP
**Version:** 1.0 | **Status:** Ready to Deploy | **Time:** 15 Minuten

---

## ⚡ QUICK START (5 Minuten)

```bash
# 1. Install MCP Servers
npm install -g @anthropics/serena-mcp @anthropics/context7-mcp
pip install skyvern n8n

# 2. Configure Claude
mkdir -p ~/.claude
cat > ~/.claude/settings.json << 'EOF'
{
  "mcpServers": {
    "serena": {"command": "npx", "args": ["-y", "@anthropics/serena-mcp"]},
    "skyvern": {"command": "python", "args": ["-m", "skyvern.mcp.server"]},
    "context7": {"command": "npx", "args": ["-y", "@anthropics/context7-mcp"]}
  },
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true
  }
}
EOF

# 3. Copy Master Loop Files
cp /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/.claude/* ~/.claude/

# 4. Make Skyvern Executable
chmod +x ~/.claude/SKYVERN_BLUEPRINT.py

# 5. Test Installation
python ~/.claude/SKYVERN_BLUEPRINT.py --project zoe-solar-accounting-ocr
```

---

## 📦 INSTALLATION DETAILS

### Schritt 1: MCP Server Installation

```bash
# Serena MCP (Code Analysis)
npm install -g @anthropics/serena-mcp

# Context7 MCP (Documentation)
npm install -g @anthropics/context7-mcp

# Skyvern (Browser Automation)
pip install skyvern
npx playwright install  # Browser binaries

# n8n (Workflow Automation)
npm install -g n8n
# Oder: Docker
docker run -it -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

### Schritt 2: Claude Code Configuration

```bash
# Create settings directory
mkdir -p ~/.claude

# Configure MCP servers & plugins
cat > ~/.claude/settings.json << 'EOF'
{
  "env": {
    "ANTHROPIC_BASE_URL": "https://api.minimax.io/anthropic",
    "ANTHROPIC_AUTH_TOKEN": "DEIN_API_KEY",
    "ANTHROPIC_MODEL": "MiniMax-M2.1",
    "API_TIMEOUT_MS": "3000000"
  },
  "mcpServers": {
    "serena": {
      "command": "npx",
      "args": ["-y", "@anthropics/serena-mcp"],
      "description": "Code Analysis & Architecture"
    },
    "skyvern": {
      "command": "python",
      "args": ["-m", "skyvern.mcp.server"],
      "description": "Browser Automation & Monitoring"
    },
    "context7": {
      "command": "npx",
      "args": ["-y", "@anthropics/context7-mcp"],
      "description": "Documentation & Examples"
    }
  },
  "enabledPlugins": {
    "feature-dev@claude-code-plugins": true,
    "ralph-wiggum@claude-code-plugins": true
  }
}
EOF
```

### Schritt 3: Global Infrastructure Setup

```bash
# Create global infrastructure file
cat > ~/.claude/GLOBAL_INFRASTRUCTURE.md << 'EOF'
# 🌍 GLOBALE INFRASTRUKTUR
**VM1:** 130.162.235.142
**SSH Key:** ~/.ssh/aura-call-vm-key
**Supabase:** https://supabase.aura-call.de
**Vercel:** https://zoe-solar-accounting-ocr.vercel.app
EOF

# Create quick reference
cat > ~/.claude/QUICK_REFERENCE.md << 'EOF'
# ⚡ QUICK REFERENCE
## SSH
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142

## Supabase
curl -I https://supabase.aura-call.de

## Deploy
cd /path/to/project && git push origin main && vercel --prod
EOF
```

### Schritt 4: Project Integration

```bash
# In each project directory:
mkdir -p .claude

# Create project knowledge base
cat > .claude/PROJECT_KNOWLEDGE.md << 'EOF'
# Project: [Name]
- Tech Stack: [List]
- VM: 130.162.235.142
- Supabase: https://supabase.aura-call.de
- Deployment: Vercel
- Status: Active
EOF

# Copy workflow files
cp ~/.claude/N8N_WORKFLOW.yaml .claude/
cp ~/.claude/SKYVERN_BLUEPRINT.py .claude/
```

---

## 🎯 USAGE EXAMPLES

### Example 1: Fix Supabase Connection

```bash
# In Claude Code:
"Start Master Developer Loop for: Fix Supabase ERR_CONNECTION_REFUSED"

# What happens:
1. ✅ Serena analyzes code
2. ✅ Researches state-of-the-art solutions
3. ✅ Creates task queue
4. ✅ Code Agent implements fixes
5. ✅ Tests run automatically
6. ✅ Deploys to Vercel
7. ✅ Skyvern monitors deployment
8. ✅ Report generated in ~/.claude/MONITORING_REPORT.md
```

### Example 2: New Feature Development

```bash
# In Claude Code:
"Start Master Developer Loop for: Add PDF export feature"

# What happens:
1. ✅ Researches best PDF libraries
2. ✅ Creates architecture proposal
3. ✅ Implements feature with tests
4. ✅ Deploys and monitors
```

### Example 3: Continuous Monitoring

```bash
# Terminal:
python ~/.claude/SKYVERN_BLUEPRINT.py --monitor --interval 300

# Or n8n workflow:
# Auto-runs every 5 minutes
```

---

## 🔧 MANUAL COMMANDS

### Check Everything

```bash
# 1. VM Status
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"

# 2. Supabase Health
curl -I https://supabase.aura-call.de

# 3. Vercel Status
curl -I https://zoe-solar-accounting-ocr.vercel.app

# 4. Run Skyvern Monitor
python ~/.claude/SKYVERN_BLUEPRINT.py --project zoe-solar-accounting-ocr

# 5. Check Task Queue
cat ~/.claude/TASK_QUEUE.yaml

# 6. View Latest Report
cat ~/.claude/MONITORING_REPORT.md
```

### Deploy Manually

```bash
cd /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr

# Build & Test
npm run build
npm run test

# Git Operations
git add -A
git commit -m "feat: Master Loop Update"
git push origin main

# Deploy
vercel --prod --yes

# Monitor
python ~/.claude/SKYVERN_BLUEPRINT.py --project zoe-solar-accounting-ocr
```

---

## 📊 MONITORING & LOGS

### Files Created

```
~/.claude/
├── GLOBAL_INFRASTRUCTURE.md      # All secrets & configs
├── QUICK_REFERENCE.md            # Quick commands
├── MASTER_DEVELOPER_LOOP.md      # Architecture doc
├── N8N_WORKFLOW.yaml             # n8n automation
├── SKYVERN_BLUEPRINT.py          # Monitoring script
├── SETUP_GUIDE.md                # This file
├── RESEARCH_LOG.md               # Research history
├── TASK_QUEUE.yaml               # Current tasks
├── MONITORING_REPORT.md          # Latest report
├── PROJECT_KNOWLEDGE.md          # Project info
└── ERROR_SOLUTIONS.md            # Known fixes
```

### Real-time Monitoring

```bash
# Watch logs
tail -f ~/.claude/MONITORING_REPORT.md

# Or use n8n dashboard
open http://localhost:5678
```

---

## ⚠️ TROUBLESHOOTING

### Issue: MCP Servers Not Found

```bash
# Check installation
which npx
which python
npm list -g @anthropics/serena-mcp

# Reinstall if needed
npm install -g @anthropics/serena-mcp
```

### Issue: Skyvern Not Working

```bash
# Install Playwright
npx playwright install

# Check Python
python --version  # Should be 3.9+
pip show skyvern

# Test manually
python -c "from skyvern import Skyvern; print('OK')"
```

### Issue: n8n Not Starting

```bash
# Start n8n
n8n start

# Or Docker
docker run -it -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n
```

### Issue: Permission Denied

```bash
# Fix permissions
chmod 600 ~/.ssh/aura-call-vm-key
chmod +x ~/.claude/SKYVERN_BLUEPRINT.py
chmod 700 ~/.claude
```

---

## 🎓 ADVANCED SETUP

### n8n Webhook Integration

```bash
# Get webhook URL from n8n
# Add to Claude settings:
cat >> ~/.claude/settings.json << 'EOF'
{
  "env": {
    "N8N_WEBHOOK_URL": "https://your-n8n-instance.com/webhook/claude-master-loop"
  }
}
EOF
```

### Slack Notifications

```bash
# Add Slack webhook to n8n workflow
# Edit ~/.claude/N8N_WORKFLOW.yaml
# Update Slack channel in alert sections
```

### GitHub Integration

```bash
# Add GitHub webhook
# Repository → Settings → Webhooks
# Payload URL: https://your-n8n.com/webhook/github-push
# Events: Pushes
```

---

## ✅ VERIFICATION CHECKLIST

Run this after setup:

- [ ] `npm list -g @anthropics/serena-mcp` shows installed
- [ ] `pip show skyvern` shows installed
- [ ] `python ~/.claude/SKYVERN_BLUEPRINT.py --project test` runs without errors
- [ ] `cat ~/.claude/GLOBAL_INFRASTRUCTURE.md` shows your config
- [ ] `claude --version` shows 2.0.76+
- [ ] `vercel --version` shows installed
- [ ] `ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "echo OK"` works

---

## 🚀 NEXT STEPS

### After Setup:

1. **Test the Loop:**
   ```bash
   # In Claude Code:
   "Start Master Developer Loop for: Test Supabase connection"
   ```

2. **Monitor First Run:**
   ```bash
   # Watch the magic:
   tail -f ~/.claude/MONITORING_REPORT.md
   ```

3. **Customize for Your Needs:**
   - Edit `~/.claude/N8N_WORKFLOW.yaml`
   - Add custom tasks
   - Configure alerts

4. **Scale to Multiple Projects:**
   - Copy `.claude/` to new projects
   - Update project-specific configs
   - Run loop independently per project

---

## 📞 SUPPORT

### Common Commands:

```bash
# Full system check
python ~/.claude/SKYVERN_BLUEPRINT.py --project zoe-solar-accounting-ocr

# View all configs
cat ~/.claude/GLOBAL_INFRASTRUCTURE.md
cat ~/.claude/QUICK_REFERENCE.md

# Check task queue
cat ~/.claude/TASK_QUEUE.yaml

# View latest report
cat ~/.claude/MONITORING_REPORT.md

# Start n8n
n8n start
```

### Need Help?

1. Check `~/.claude/MASTER_DEVELOPER_LOOP.md` for architecture details
2. Run: `python ~/.claude/SKYVERN_BLUEPRINT.py --help`
3. Check n8n logs: `~/.n8n/logs`

---

**Status:** ✅ Ready to use
**Version:** 1.0
**Last Updated:** 2026-01-06

**"Setup complete! Start your first Master Developer Loop with: 'Start Master Developer Loop for: [your task]'"** 🚀
