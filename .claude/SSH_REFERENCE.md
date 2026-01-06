# SSH Reference Guide
**VM:** ngze-control-vm1-restored
**IP:** 130.162.235.142
**Key:** ~/.ssh/aura-call-vm-key

---

## Quick Connect

```bash
# Standard connection
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142

# With verbose output (for debugging)
ssh -v -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142
```

---

## Docker Commands

### View All Services
```bash
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker ps --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'"
```

### Service Management
```bash
# Restart all services
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart"

# Restart specific service
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart supabase"

# View logs
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs <container-name> --tail 100 -f"
```

### Supabase Specific
```bash
# Check Supabase status
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose ps | grep supabase"

# View Supabase REST API logs
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs ngze-techstack-supabase-rest-1 --tail 50"

# View Supabase Studio logs
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker logs ngze-techstack-supabase-studio-1 --tail 50"
```

---

## System Info

### Resource Usage
```bash
# Memory
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "free -h"

# Disk
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "df -h"

# Docker disk usage
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker system df"

# Running processes
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "top -bn1 | head -20"
```

### Docker Cleanup
```bash
# Remove unused images/volumes
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker system prune -a --volumes"
```

---

## File Management

### View Configuration
```bash
# View .env file
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cat ~/ngze-tech.stack/.env"

# View docker-compose.yml
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cat ~/ngze-tech.stack/docker-compose.yml"
```

### Edit Files (using nano)
```bash
# Edit .env
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "nano ~/ngze-tech.stack/.env"

# After editing, restart affected services
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose restart"
```

### Copy Files From VM
```bash
# Copy .env to local
scp -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142:~/ngze-tech.stack/.env ./

# Copy logs
scp -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142:~/ngze-tech.stack/*.log ./
```

---

## Troubleshooting

### SSH Permission Denied
```bash
# Fix permissions
chmod 600 ~/.ssh/aura-call-vm-key
chmod 700 ~/.ssh
```

### Connection Timeout
```bash
# Check if VM is running in OCI Console
# Compute → Instances → ngze-control-vm1-restored

# Check security list (Port 22 open)
# Networking → VCN → Security Lists
```

### Docker Issues
```bash
# Check Docker daemon
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "sudo systemctl status docker"

# Restart Docker if needed
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "sudo systemctl restart docker"
```

---

## Supabase Health Check

```bash
# Test from VM
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "curl -I http://localhost:8000"

# Test from local
curl -I https://supabase.aura-call.de

# Test API endpoint
curl "https://supabase.aura-call.de/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

---

## Backup Commands

### Manual Backup
```bash
# Check existing backups
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker volume ls"

# Create backup (if using docker volumes)
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose exec -T postgres pg_dump -U postgres postgres > backup.sql"
```

### View Backup Logs
```bash
# Check Supabase backup logs table
# Connect to Supabase and query:
# SELECT * FROM backup_logs ORDER BY created_at DESC LIMIT 10;
```

---

## Emergency Commands

### If Supabase is Down
```bash
# Full restart
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "cd ~/ngze-tech.stack && docker compose down && docker compose up -d"

# Check specific container
ssh -i ~/.ssh/aura-call-vm-key ubuntu@130.162.235.142 "docker inspect ngze-techstack-supabase-rest-1"
```

### If VM Won't Boot
1. Go to OCI Console
2. Compute → Instances → ngze-control-vm1-restored
3. Actions → Soft Reset
4. Wait 2 minutes, then try SSH

### If Completely Lost
1. Compute → Boot Volume Backups
2. Find: `vm1-emergency-backup-1766902352`
3. Actions → Create Instance
4. Use same shape (VM.Standard.A1.Flex)
5. **CRITICAL:** Note new IP and update all configs

---

## SSH Config (Optional)

Add to `~/.ssh/config` for easier access:
```
Host oci-vm1
    HostName 130.162.235.142
    User ubuntu
    IdentityFile ~/.ssh/aura-call-vm-key
    IdentitiesOnly yes

Host vm1
    HostName 130.162.235.142
    User ubuntu
    IdentityFile ~/.ssh/aura-call-vm-key
    IdentitiesOnly yes
```

Then use: `ssh oci-vm1` or `ssh vm1`

---

## Services URLs

| Service | URL | Health Check |
|---------|-----|--------------|
| Supabase API | `https://supabase.aura-call.de` | `curl -I https://supabase.aura-call.de` |
| Supabase Studio | `https://studio.aura-call.de` | Browser test |
| n8n | `https://n8n.aura-call.de` | Browser test |
| Traefik Dashboard | `https://traefik.aura-call.de` | Browser test |

---

**Last Updated:** 2026-01-06
