# ⚡ QUICK REFERENCE - ALLES AUF EINEN BLICK
**Für Claude Code - Sofort nutzbar**

---

## 🔐 WICHTIGSTE DATEN

| Was | Wert |
|-----|------|
| **VM1 IP** | `130.162.235.142` |
| **VM1 User** | `ubuntu` |
| **SSH Key** | `~/.ssh/aura-call-vm-key` |
| **Supabase URL** | `https://supabase.aura-call.de` |
| **Supabase Anon Key** | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nO2iHI` |
| **Gemini Key** | `AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk` |

---

## 💻 SSH BEFEHLE

```bash
# Verbinden
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142

# Docker Status
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"

# Alle Services
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose ps"

# Logs
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs <name> --tail 50"

# Restart Supabase
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"
```

---

## 🌐 SUPABASE TESTS

```bash
# Schnell-Test
curl -I https://supabase.aura-call.de

# Detail-Test
node check-supabase-connection.js

# Von VM aus
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "curl -I http://localhost:8000"
```

---

## 🎯 CLAUDE BEFEHLE

Sage einfach:
- `"Prüfe VM1 Status"`
- `"Restart Supabase"`
- `"Zeige Logs"`
- `"SSH zu VM1 und zeige free -h"`
- `"Supabase connection test"`
- `"Query belege table"`

**Claude weiß automatisch:**
- VM1 IP: 130.162.235.142
- SSH Key: ~/.ssh/aura-call-vm-key
- Supabase: https://supabase.aura-call.de

---

## 🚨 PROBLEM? SO LÖST DU'S

### SSH funktioniert nicht
```bash
chmod 600 ~/.ssh/aura-call-vm-key
ssh -v -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142
```

### Supabase Error
```bash
# Prüfe VM
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps | grep supabase"

# Restart
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"
```

### VM nicht erreichbar
- OCI Console → Compute → Instances
- Prüfe Status: ngze-control-vm1-restored
- Actions → Soft Reset

---

## 📁 DATEIEN

```
~/.claude/
  ├── GLOBAL_INFRASTRUCTURE.md  ← Alle Details
  ├── CLAUDE_USAGE_GUIDE.md     ← Wie mit Claude arbeiten
  └── QUICK_REFERENCE.md        ← Dieses File

~/.ssh/
  └── aura-call-vm-key          ← SSH Key für VM1

/projekt/.claude/
  ├── PROJECT_KNOWLEDGE.md      ← Projektdaten
  └── SSH_REFERENCE.md          ← SSH Commands
```

---

## ✅ VOR PROJEKT-START

```bash
# 1. SSH Key prüfen
chmod 600 ~/.ssh/aura-call-vm-key

# 2. VM testen
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "echo OK"

# 3. Supabase testen
curl -I https://supabase.aura-call.de

# 4. .env erstellen
cat > .env << EOF
VITE_SUPABASE_URL=https://supabase.aura-call.de
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nO2iHI
VITE_GEMINI_API_KEY=AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk
EOF
```

---

## 🎬 LOS GEHT'S

```bash
# In jedem neuen Projekt:
echo "VITE_SUPABASE_URL=https://supabase.aura-call.de" > .env
echo "VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nO2iHI" >> .env
echo "VITE_GEMINI_API_KEY=AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk" >> .env

# Dann:
npm run dev

# Fertig! 🚀
```

---

**Version:** 1.0 | **Letztes Update:** 2026-01-06
