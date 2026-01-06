# ZOE Solar Accounting OCR - Project Knowledge Base
**Last Updated:** 2026-01-06
**Project Owner:** Jeremy
**Critical:** VM1 is the central component - NEVER recreate it!

---

## 🚨 CRITICAL INFRASTRUCTURE

### Oracle Cloud VM1 - ngze-control-vm1-restored
```
IP: 130.162.235.142 (⚠️ NEVER CHANGE!)
Name: ngze-control-vm1-restored
Region: EU-Frankfurt-1
Status: ✅ RUNNING
SSH Key: ~/.ssh/aura-call-vm-key
User: ubuntu
```

**Hardware:**
- Shape: VM.Standard.A1.Flex (ARM64)
- OCPUs: 4
- RAM: 24 GB
- Storage: 47 GB Boot Volume
- OS: Ubuntu 24.04 LTS (ARM64)

**OCIDs:**
- Instance: `ocid1.instance.oc1.eu-frankfurt-1.antheljtdw6zasqckojhngu5c5qps4zckjwah64kowk3vdgcjt4qafh7cl6q`
- Boot Volume: `ocid1.bootvolume.oc1.eu-frankfurt-1.abtheljt66hrirlgck2cs5k37r7o64bo7rpx6hcjyrqjyuf5on27o6ioyena`
- Backup: `ocid1.bootvolumebackup.oc1.eu-frankfurt-1.abtheljtycu36dvucvcoa2ogs5l22ql6pi7z6nq3arrvuulkjewzrzjzj4ba`

### Emergency Recovery
If VM1 is lost:
1. Use Boot Volume Backup `vm1-emergency-backup-1766902352`
2. Create new VM from backup
3. Update all 119 files with new IP
4. Update DNS records

---

## 🔐 SECRETS & ENVIRONMENT VARIABLES

### Supabase Configuration
```bash
# API URL
VITE_SUPABASE_URL=https://supabase.aura-call.de

# Anon Key (Public - for browser/client)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJvbGUiOiJhbm9uIn0.ZopqoUt20nEV9cklpv9e3yw3PVyZLmKs5qLD6nO2iHI

# Service Role Key (Private - server-side only!)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.O7BlOC5zg16e_zEUJYA5RRGYwWTxHg7fkesbo7D8foM

# JWT Secret
SUPABASE_JWT_SECRET=ad2DKV5fqfk9N5iJt90DFVkuJ_oa7Q3RP4pgHPm4bVuWRToLQ4AysvgZTcxeMLIy
```

### Gemini API Key
```bash
VITE_GEMINI_API_KEY=AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk
```

### GitLab Configuration (Optional)
```bash
VITE_GITLAB_TOKEN=your-gitlab-token
VITE_GITLAB_PROJECT_ID=your-project-id
```

---

## 🌐 Supabase Services on VM1

All services run via Traefik reverse proxy:

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Supabase API | 8000 | `https://supabase.aura-call.de` | ✅ Active |
| Supabase Studio | 8000 | `https://studio.aura-call.de` | ✅ Active |
| n8n | 5678 | `https://n8n.aura-call.de` | ✅ Active |
| OAuth Server | 3000 | `https://oauth.aura-call.de` | ✅ Active |
| Skyvern | 8000 | `https://skyvern.aura-call.de` | ✅ Active |
| WAHA | 3000 | `https://waha.aura-call.de` | ✅ Active |
| Traefik Dashboard | 8080 | `https://traefik.aura-call.de` | ✅ Active |

### DNS Configuration (Ionos)
```
n8n           A    130.162.235.142
supabase      A    130.162.235.142
studio        A    130.162.235.142
oauth         A    130.162.235.142
skyvern       A    130.162.235.142
waha          A    130.162.235.142
```

---

## 💻 SSH Access Commands

### Direct Connection
```bash
# Standard connection
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142

# With SSH config (if configured)
ssh oci-vm1
ssh vm1
```

### Docker Management
```bash
# List all containers
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps"

# Docker Compose status
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose ps"

# View logs (last 50 lines)
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs ngze-techstack-n8n-1 --tail 50"

# Restart Supabase
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"
```

### Check VM Status
```bash
# Check if services are running
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps --format 'table {{.Names}}\t{{.Status}}'"

# Check disk space
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "df -h"

# Check memory
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "free -h"
```

---

## 📁 Important Paths on VM1

```
/home/ubuntu/ngze-tech.stack/          # Main Docker stack
/home/ubuntu/ngze-tech.stack/.env      # Environment variables
/home/ubuntu/ngze-tech.stack/docker-compose.yml
/var/lib/docker/                      # Docker data
```

---

## 🔧 Troubleshooting

### SSH Issues
```bash
# Fix key permissions
chmod 600 ~/.ssh/aura-call-vm-key

# Check VM status in OCI Console
# Compute → Instances → ngze-control-vm1-restored

# Check Security List (Port 22 must be open)
# Networking → Virtual Cloud Networks → Security Lists
```

### Supabase Connection Issues
If you see `ERR_CONNECTION_REFUSED`:

1. **Check if Supabase is running:**
   ```bash
   ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose ps | grep supabase"
   ```

2. **Restart Supabase:**
   ```bash
   ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"
   ```

3. **Check Supabase logs:**
   ```bash
   ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs supabase-rest --tail 50"
   ```

4. **Test connectivity:**
   ```bash
   curl -I https://supabase.aura-call.de
   ```

### Diagnostic Script
Run the diagnostic script from project root:
```bash
node check-supabase-connection.js
```

---

## 📊 Supabase Database Schema

### Tables
- `belege` - Main documents/receipts
- `beleg_positionen` - Line items for documents
- `steuerkategorien` - Tax categories
- `kontierungskonten` - Accounting accounts
- `lieferanten_regeln` - Vendor rules
- `einstellungen` - Application settings

### Common Queries
```sql
-- Get all documents
SELECT * FROM belege ORDER BY uploaded_at DESC;

-- Get documents by status
SELECT * FROM belege WHERE status = 'PROCESSING';

-- Get settings
SELECT * FROM einstellungen WHERE schluessel = 'app_settings';
```

---

## 🔄 Backup Strategy

### Automated Backups
- **Frequency:** Daily at 02:00 UTC
- **Location:** Supabase `backup_logs` table
- **Type:** Boot Volume Backup

### Manual Backup
```bash
# Create backup via OCI CLI
oci bv backup create --boot-volume-id ocid1.bootvolume.oc1.eu-frankfurt-1.abtheljt66hrirlgck2cs5k37r7o64bo7rpx6hcjyrqjyuf5on27o6ioyena --type FULL
```

---

## 🎯 Application Behavior

### When Supabase is Unavailable
The application gracefully handles Supabase failures:
- ✅ App continues in offline mode
- ✅ OCR processing still works
- ✅ Data cached locally
- ✅ Errors logged but don't crash app

### Connection Testing
```typescript
// Check Supabase health
import { checkSupabaseHealth } from './src/services/supabaseService';

const health = await checkSupabaseHealth();
console.log(health); // { configured: true, reachable: true, ... }
```

---

## 📝 Quick Reference Commands

### Test Supabase Connection
```bash
# From local machine
node check-supabase-connection.js
```

### Check VM Health
```bash
# All services status
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose ps"
```

### View Application Logs
```bash
# Application logs (if running)
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs ngze-techstack-app-1 --tail 100"
```

---

## ⚠️ CRITICAL WARNINGS

1. **NEVER recreate VM1** - It contains 119+ files that depend on this specific VM
2. **NEVER change the IP** - All DNS records and configurations use 130.162.235.142
3. **Service Role Key is PRIVATE** - Only use server-side, never in browser
4. **Backup before major changes** - Always create a snapshot first
5. **Test SSH before deploying** - Ensure key permissions are correct (600)

---

## 📞 Emergency Contacts

If VM1 is lost:
1. Restore from Boot Volume Backup: `vm1-emergency-backup-1766902352`
2. Update all configurations with new IP
3. Update DNS records in Ionos
4. Verify all services are running

---

**Document Version:** 1.0
**Last Verified:** 2026-01-06
**Status:** ✅ All systems operational
