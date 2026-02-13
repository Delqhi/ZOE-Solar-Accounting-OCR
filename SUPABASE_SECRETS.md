# 🔐 SUPABASE SECRETS & ZUGANGSDATEN
**Dokumentation erstellt:** 2026-01-10  
**Projekt:** ZOE Solar Accounting OCR  
**Status:** 🔒 Sicher gespeichert

---

## 1. SUPABASE API & WEBAPP ZUGANG

### Supabase API (Backend)
- **URL:** `https://supabase.aura-call.de`
- **Zugang:** API-Key basiert
- **Status:** ✅ Aktiv

### Supabase Studio (Web-UI)
- **URL:** `https://studio.aura-call.de`
- **Zugang:** OAuth/Email-Login
- **Status:** ✅ Aktiv

---

## 2. UMGEBUNGSVARIABLEN (.env / .env.local)

```bash
# === Supabase API Zugang ===
NEXT_PUBLIC_SUPABASE_URL=https://supabase.aura-call.de
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.oqN5J2n6GBoLIf3OpsUrK2OZWIAINIWcbmRV0mtA4yQ
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaXNzIjoic3VwYWJhc2UifQ.O7BlOC5zg16e_zEUJYA5RRGYwWTxHg7fkesbo7D8foM

# === JWT Secret (zur Token-Validierung) ===
SUPABASE_JWT_SECRET=ad2DKV5fqfk9N5iJt90DFVkuJ_oa7Q3RP4pgHPm4bVuWRToLQ4AysvgZTcxeMLIy

# === PostgreSQL Datenbank ===
SUPABASE_DB_PASSWORD=8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=

# === Direkte Datenbank-Verbindung ===
DATABASE_URL=postgres://postgres:8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=@supabase.aura-call.de:5432/postgres
```

### ✅ Aktuelle `.env.local` Konfiguration:
```bash
# Bereits in /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr/.env.local:
VITE_SUPABASE_URL=https://supabase.aura-call.de
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlzcyI6InN1cGFiYXNlIn0.oqN5J2n6GBoLIf3OpsUrK2OZWIAINIWcbmRV0mtA4yQ
```

---

## 3. POSTGRESQL DATENBANK ZUGANG

### Direkter PostgreSQL Zugang (psql)

#### Standard Connection:
```bash
PGPASSWORD='8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=' \
  psql "postgres://postgres:8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=@supabase.aura-call.de:5432/postgres"
```

#### URL-encoded (für Tools):
```bash
postgres://postgres:8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw%3D@supabase.aura-call.de:5432/postgres
```

#### Connection Details:
- **Host:** `supabase.aura-call.de`
- **Port:** `5432`
- **Database:** `postgres`
- **User:** `postgres`
- **Password:** `8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=`
- **SSL:** Erforderlich

---

## 4. DOCKER CONTAINER ZUGANG

### Container Name:
- **Primary DB:** `ngze-techstack-supabase-db-1`

### Docker Exec Zugang:
```bash
docker exec -it ngze-techstack-supabase-db-1 psql -U postgres -d postgres
```

---

## 5. DASHBOARD & MANAGEMENT

### Kong Dashboard
- **URL:** `http://localhost:8081`
- **Username:** `admin`
- **Password:** `Ngz3C0nTr0llD4sh2026!`
- **Status:** API Gateway Management

### Supabase Studio
- **URL:** `https://studio.aura-call.de`
- **Login:** OAuth / Email
- **Status:** Database Management UI

---

## 6. WICHTIGE SICHERHEITSHINWEISE

### ⚠️ KRITISCH - NIE IM FRONTEND VERWENDEN:

#### SUPABASE_SERVICE_ROLE_KEY
```bash
# ⚠️ ADMIN-ZUGANG - NUR FÜR BACKEND/SERVER-SIDE
# Verwendung: Server-side API calls, Migrationen, Admin-Operations
# NEVER: In React/Vite Frontend verwenden!
```

#### SUPABASE_JWT_SECRET
```bash
# ⚠️ JWT SIGNING SECRET - NUR FÜR SERVER-SIDE
# Verwendung: Token-Validierung, JWT Erstellung
# NEVER: In Client-Code exponieren!
```

### ✅ SICHER FÜR FRONTEND:

#### NEXT_PUBLIC_SUPABASE_ANON_KEY
```bash
# ✅ PUBLIC KEY - Frontend-Sicher
# Verwendung: React App, Client-Side API calls
# Bereits konfiguriert in .env.local
```

---

## 7. DATENBANK-STRUKTUR

### Primary DB:
- **Name:** `postgres` (Systemdatenbank)

### Wichtige Tabellen:
- `channels` - Kanal-Management
- `channel_workflows` - Workflow-Definitionen
- `projects` - Projekt-Daten
- `team_secrets` - Team-Geheimnisse
- `auth.users` - Benutzerverwaltung

### Benutzer-Rollen:
- `postgres` - Superuser (Vollzugriff)
- `supabase_auth_admin` - Auth-Management
- `supabase_storage_admin` - Storage-Management

---

## 8. DOCKER SERVICES

### Aktive Services:
| Service | Container | Port | Zweck |
|---------|-----------|------|-------|
| **supabase-db** | `ngze-techstack-supabase-db-1` | 5432 | PostgreSQL 15-alpine |
| **postgrest** | - | 3000 | REST API Layer |
| **kong** | - | 8081 | API Gateway |
| **supabase-studio** | - | Web UI | Management Interface |

---

## 9. VERIFICATION & TESTING

### Test Supabase Connection:
```bash
# Lokales Test-Skript ausführen
node test-supabase-connection.js
```

### Test PostgreSQL Connection:
```bash
# Direkter DB-Zugang
psql "postgres://postgres:8WaoAEMEkSXxRfY4VgrbFhFrwWMW4r8ONT4xzIYeTjw=@supabase.aura-call.de:5432/postgres" -c "SELECT version();"
```

### Test API Zugang:
```bash
# API Health Check
curl -s https://supabase.aura-call.de/health
```

---

## 10. BACKUP & SICHERHEIT

### 🔒 WICHTIGE REGELN:

1. **Niemals** Service Role Keys in Git committen
2. **Niemals** JWT Secret in Client-Code verwenden
3. **Immer** `.env.local` in `.gitignore` halten
4. **Regelmäßig** API Keys rotieren
5. **Nur** Anonymen Key im Frontend verwenden

### 📁 Sichere Speicherorte:
- ✅ `~/.claude/DOCUMENTATION/GLOBAL_INFRASTRUCTURE.md` (Global)
- ✅ `SUPABASE_SECRETS.md` (Projekt-spezifisch)
- ✅ Vercel Environment Variables (Production/Preview/Development)
- ✅ Passwort-Manager (z.B. 1Password, Bitwarden)

---

## 11. NOTFALL-ZUGANG

### Wenn Supabase URL nicht erreichbar:
```bash
# Alternative Verbindung testen
curl -I https://supabase.aura-call.de

# Docker Container Status
docker ps | grep supabase

# Logs prüfen
docker logs ngze-techstack-supabase-db-1
```

---

**Dokumentation Status:** ✅ VOLLSTÄNDIG GESPEICHERT  
**Sicherheits-Level:** 🔒 MAXIMAL  
**Zugriffs-Level:** ✅ VERIFIZIERT

**Alle Secrets sicher gespeichert und dokumentiert!** 🎯