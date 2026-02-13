# Zoe Solar Accounting OCR - Deployment Guide

**Version**: 1.0  
**Date**: February 2026  
**Status**: Production Ready  
**Audience**: DevOps / Operations Team

---

## 📋 Table of Contents

1. [Deployment Overview](#deployment-overview)
2. [Prerequisites & Requirements](#prerequisites--requirements)
3. [Pre-Deployment Checklist](#pre-deployment-checklist)
4. [Step-by-Step Deployment Instructions](#step-by-step-deployment-instructions)
5. [Environment Configuration](#environment-configuration)
6. [Service Worker Deployment](#service-worker-deployment)
7. [Health Check Procedures](#health-check-procedures)
8. [Rollback Procedures](#rollback-procedures)
9. [Post-Deployment Monitoring](#post-deployment-monitoring)
10. [Troubleshooting Guide](#troubleshooting-guide)
11. [Emergency Contacts & Escalation](#emergency-contacts--escalation)

---

## Deployment Overview

### What is Being Deployed

This deployment installs **Zoe Solar Accounting OCR** - a production-ready React Single Page Application (SPA) with the following components:

**Frontend Application**:

- React 19.2.3 SPA with TypeScript
- Code-split architecture (240+ optimized modules)
- Integrated service worker for offline capability
- Gzip-compressed assets (80.4% reduction)
- PWA-ready with Workbox service worker

**Application Features**:

- K1 field integration (24 accounting fields)
- SKR03 accounting code support (German standard)
- Tax category handling (19%, 7%, 0%)
- Validation framework for financial data
- Supabase backend integration
- PDF handling capabilities
- State management with Redux
- XSS protection via dompurify v3.2.0

**Deployment Artifacts**:

- 12 optimized production files (~295 kB gzipped)
- Single-page application entry point (index.html)
- Service worker for offline functionality
- CSS, JavaScript bundles with code splitting
- Static assets (optimized for performance)

### Architecture Overview

```
[Client Browser]
    ↓
[CDN / Static Server] ← Serves dist/ contents
    ↓
[React SPA] (index.html + assets)
    ↓
[Service Worker] (dist/service-worker.js)
    ↓
[Supabase Backend] (configured via environment)
```

### Deployment Scope

| Component             | Scope               | Status             |
| --------------------- | ------------------- | ------------------ |
| React Frontend        | Included            | ✅ Ready           |
| Service Worker        | Included            | ✅ Ready           |
| Static Assets         | Included            | ✅ Ready           |
| Backend Configuration | Environment-based   | ⚙️ Config Required |
| Database              | Supabase (external) | ℹ️ Reference Only  |

### Key Metrics

| Metric                | Value        | Notes          |
| --------------------- | ------------ | -------------- |
| **Build Exit Code**   | 0            | ✅ Success     |
| **Build Time**        | 5.65 seconds | Normal         |
| **Total Modules**     | 240          | All optimized  |
| **Uncompressed Size** | ~1,508 kB    | Source size    |
| **Compressed Size**   | ~295 kB      | After gzip     |
| **Compression Ratio** | 80.4%        | Optimal        |
| **Artifacts**         | 12 files     | All verified   |
| **Error Count**       | 0            | ✅ No errors   |
| **Warning Count**     | 0            | ✅ No warnings |

---

## Prerequisites & Requirements

### Infrastructure Requirements

**Web Server / Hosting**:

- Static file serving capability (nginx, Apache, or CDN)
- HTTPS support (TLS 1.2+)
- gzip compression support
- SPA routing support (serve index.html for 404s)
- CORS configuration if backend is on different domain

**Hardware Specifications** (Recommended):

- 2+ CPU cores
- 2GB RAM minimum
- 10GB free disk space
- Network bandwidth: 1+ Mbps

**Network Requirements**:

- HTTPS enabled on production domain
- DNS records properly configured
- Firewall rules allow incoming HTTP/HTTPS (ports 80/443)
- Outbound access to Supabase endpoints (backend)

### Software Requirements

**Server Software**:

- Node.js 18+ (for build process verification)
- npm 9+ (for dependency management)
- Web server (nginx 1.20+, Apache 2.4+, or equivalent)
- Optional: Docker for containerized deployment

**Browser Support** (End Users):

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers supporting ES2020

### Access & Credentials

**Required Credentials**:

- [ ] Supabase API URL (environment variable)
- [ ] Supabase Anon Key (environment variable)
- [ ] Optional: Supabase Service Role Key (if needed)

**Required Access**:

- [ ] Web server SSH/RDP access
- [ ] DNS management access
- [ ] SSL certificate management access
- [ ] Logging/monitoring system access

### Development Tools (For Support Team)

**Recommended Tools**:

- Text editor (VS Code recommended)
- Git client (for version control)
- cURL or Postman (for API testing)
- Browser DevTools (for debugging)
- Network analyzer (for performance monitoring)

### Network Connectivity

**Outbound Connections Required**:

- Supabase API endpoints (https://api.supabase.co or custom domain)
- CDN endpoints (if using CDN)
- Third-party analytics (if configured)

**Inbound Connections**:

- HTTP (port 80) - redirect to HTTPS
- HTTPS (port 443) - primary traffic
- Optional: SSH (port 22) for server management

---

## Pre-Deployment Checklist

### ✅ Final Verification Before Deployment

Complete all items below before proceeding to deployment:

**Build Verification**:

- [ ] Latest production build executed successfully
- [ ] Build exit code = 0 (verify: `echo $?` returns 0)
- [ ] No error messages in build output
- [ ] No warning messages in build output
- [ ] All 12 artifacts present in `/dist/` directory
- [ ] Service worker file exists at `dist/service-worker.js`
- [ ] index.html exists and is valid
- [ ] All asset files present and non-empty

**Dependency Verification**:

- [ ] package.json dompurify version = "3.2.0" (exact pin, no caret)
- [ ] All npm packages installed without errors
- [ ] No security vulnerabilities in dependencies (run: `npm audit`)
- [ ] Node.js version 18+ installed
- [ ] npm version 9+ installed

**Configuration Verification**:

- [ ] vite.config.ts reviewed and valid
- [ ] tsconfig.json reviewed and valid
- [ ] Environment variables documented
- [ ] Supabase endpoints identified
- [ ] API keys/credentials secured in secrets manager

**Target Environment Verification**:

- [ ] Web server is operational and accessible
- [ ] Disk space available (>100MB minimum for dist contents)
- [ ] Web server process has read permissions for dist/
- [ ] HTTPS/SSL certificate is valid and not expired
- [ ] DNS records point to correct server IP
- [ ] Firewall allows incoming traffic on ports 80/443
- [ ] CORS headers configured if needed
- [ ] Logging system is operational

**Security Verification**:

- [ ] Secrets (API keys) are in environment variables, NOT in code
- [ ] No sensitive data in version control
- [ ] HTTPS is enforced (HTTP redirects to HTTPS)
- [ ] Security headers configured (Content-Security-Policy, X-Frame-Options, etc.)
- [ ] dompurify XSS protection is enabled

**Rollback Preparation**:

- [ ] Previous production version backed up
- [ ] Rollback procedure tested
- [ ] Communication plan prepared for rollback
- [ ] On-call support notified of deployment window

---

## Step-by-Step Deployment Instructions

### Deployment Method 1: Direct File Copy (Recommended for Small Scale)

**Prerequisites Met**: ✅ Pre-deployment checklist complete

**Step 1: Build Production Artifacts Locally**

```bash
# Navigate to project directory
cd /path/to/zoe-solar-accounting-ocr

# Install/update dependencies
npm install

# Build production artifacts
npm run build

# Verify build succeeded
# Expected: Exit code 0, no errors, 12 files in dist/
ls -la dist/
```

**Step 2: Copy Artifacts to Server**

```bash
# Option A: Using SCP (Secure Copy)
scp -r dist/* user@production-server:/var/www/zoe-accounting/

# Option B: Using rsync (recommended - faster, preserves structure)
rsync -avz --delete dist/ user@production-server:/var/www/zoe-accounting/

# Option C: Using FTP/SFTP
# Use your preferred SFTP client to upload dist/ contents
```

**Step 3: Set Permissions on Server**

```bash
# SSH into production server
ssh user@production-server

# Set correct ownership
sudo chown -R www-data:www-data /var/www/zoe-accounting/

# Set correct permissions (755 for directories, 644 for files)
sudo chmod -R 755 /var/www/zoe-accounting/
find /var/www/zoe-accounting/ -type f -exec chmod 644 {} \;
```

**Step 4: Configure Web Server**

**For nginx**:

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name accounting.yourdomain.com;

    # SSL certificates
    ssl_certificate /etc/ssl/certs/your-cert.crt;
    ssl_certificate_key /etc/ssl/private/your-key.key;

    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Enable gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1024;
    gzip_vary on;

    # Root directory
    root /var/www/zoe-accounting;
    index index.html index.htm;

    # SPA routing: serve index.html for all non-existent paths
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Service worker (no cache)
    location = /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # index.html (no cache)
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}

# HTTP to HTTPS redirect
server {
    listen 80;
    listen [::]:80;
    server_name accounting.yourdomain.com;
    return 301 https://$server_name$request_uri;
}
```

**For Apache**:

```apache
<VirtualHost *:443>
    ServerName accounting.yourdomain.com
    DocumentRoot /var/www/zoe-accounting

    # SSL configuration
    SSLEngine on
    SSLCertificateFile /etc/ssl/certs/your-cert.crt
    SSLCertificateKeyFile /etc/ssl/private/your-key.key

    # Security headers
    Header always set Strict-Transport-Security "max-age=31536000; includeSubDomains"
    Header always set X-Content-Type-Options "nosniff"
    Header always set X-Frame-Options "SAMEORIGIN"
    Header always set X-XSS-Protection "1; mode=block"
    Header always set Referrer-Policy "strict-origin-when-cross-origin"

    # Enable compression
    <IfModule mod_deflate.c>
        AddOutputFilterByType DEFLATE text/html text/plain text/xml text/css text/javascript application/javascript application/json
    </IfModule>

    # Mod Rewrite for SPA routing
    <IfModule mod_rewrite.c>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </IfModule>

    # Cache headers for static assets
    <FilesMatch "\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$">
        Header set Cache-Control "max-age=2592000, public"
    </FilesMatch>

    # No cache for service worker and index.html
    <FilesMatch "^service-worker\.js|index\.html$">
        Header set Cache-Control "no-cache, no-store, must-revalidate"
    </FilesMatch>
</VirtualHost>

# HTTP to HTTPS redirect
<VirtualHost *:80>
    ServerName accounting.yourdomain.com
    Redirect permanent / https://accounting.yourdomain.com/
</VirtualHost>
```

**Step 5: Reload Web Server**

```bash
# For nginx
sudo systemctl reload nginx
# OR
sudo nginx -s reload

# For Apache
sudo systemctl reload apache2
# OR
sudo apachectl graceful
```

### Deployment Method 2: Docker Container (Recommended for Scale)

**Step 1: Create Dockerfile**

```dockerfile
# Use lightweight nginx image
FROM nginx:1.26-alpine

# Remove default nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy production build artifacts
COPY dist/ /usr/share/nginx/html/

# Copy custom nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --quiet --tries=1 --spider http://localhost/index.html || exit 1

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Step 2: Create nginx.conf**

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css text/javascript application/javascript application/json;
    gzip_min_length 1024;

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # No cache for service worker
    location = /service-worker.js {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # No cache for index.html
    location = /index.html {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
    }
}
```

**Step 3: Build Docker Image**

```bash
# Navigate to project directory with Dockerfile
cd /path/to/zoe-solar-accounting-ocr

# Build image
docker build -t zoe-accounting:latest .

# Tag for registry
docker tag zoe-accounting:latest your-registry/zoe-accounting:latest

# Push to registry (optional)
docker push your-registry/zoe-accounting:latest
```

**Step 4: Deploy Container**

```bash
# Run container (development)
docker run -d \
  --name zoe-accounting \
  -p 80:80 \
  -e REACT_APP_SUPABASE_URL="your-supabase-url" \
  -e REACT_APP_SUPABASE_KEY="your-supabase-key" \
  zoe-accounting:latest

# Or using docker-compose
docker-compose up -d
```

**Step 5: Verify Container Health**

```bash
# Check container status
docker ps | grep zoe-accounting

# Check logs
docker logs -f zoe-accounting

# Test endpoint
curl http://localhost/index.html
```

---

## Environment Configuration

### Environment Variables

**Supabase Configuration** (Required):

```bash
# Frontend environment variables (used in browser)
REACT_APP_SUPABASE_URL="https://your-project.supabase.co"
REACT_APP_SUPABASE_KEY="your-public-anon-key"

# Optional: Analytics
REACT_APP_ENABLE_ANALYTICS="true"

# Optional: Debug mode
REACT_APP_DEBUG="false"
```

### Configuration Methods

**Method 1: .env.production File** (For local builds)

```bash
# Create file: .env.production
REACT_APP_SUPABASE_URL=https://your-project.supabase.co
REACT_APP_SUPABASE_KEY=your-anon-key
REACT_APP_DEBUG=false
```

Then rebuild:

```bash
npm run build
```

**Method 2: Web Server Environment Variables** (Recommended for production)

For nginx/Apache: Set in web server configuration
For Docker: Use -e flags or environment file

**Method 3: Runtime Injection** (Advanced)

Create a `config.js` file in `dist/` containing:

```javascript
window.__CONFIG__ = {
  SUPABASE_URL: 'https://your-project.supabase.co',
  SUPABASE_KEY: 'your-anon-key',
  DEBUG: false,
};
```

Include in `dist/index.html` before other scripts:

```html
<script src="/config.js"></script>
```

### Supabase Configuration

**Obtain Credentials**:

1. Log in to Supabase dashboard
2. Select your project
3. Go to Settings → API
4. Copy:
   - Project URL → `REACT_APP_SUPABASE_URL`
   - Anon Key → `REACT_APP_SUPABASE_KEY`

**Security Notes**:

- Anon Key is PUBLIC - it's safe to expose in frontend code
- Store Service Role Key securely - NEVER expose in frontend
- Use Row-Level Security (RLS) in Supabase for data protection
- Restrict Anon Key permissions in Supabase policies

---

## Service Worker Deployment

### Service Worker Overview

**Purpose**: Enable offline functionality and improved performance

**File**: `dist/service-worker.js` (Built by Vite/Workbox)

**Capabilities**:

- Cache static assets for offline access
- Pre-cache critical resources
- Network fallback for unavailable resources
- Background sync (if configured)

### Deployment Configuration

**Service Worker Registration**:

The React app automatically registers the service worker on load. No additional configuration needed.

**Cache Policy** (Built into service worker):

```javascript
// Workbox default behavior (pre-configured)
// Static assets: Cache first, fallback to network (30-day expiry)
// HTML/index.html: Network first, fallback to cache (no cache)
// API calls: Network first, fallback to cache (limited TTL)
```

### Verification

**Check Service Worker Status**:

1. Open browser DevTools (F12)
2. Go to Application → Service Workers
3. Should show: `service-worker.js` registered and active
4. Click "Update on reload" for testing new versions

**Manual Verification**:

```bash
# Check service worker is accessible
curl https://your-domain/service-worker.js

# Should return valid JavaScript
# Should contain "workbox" and "cacheNames"
```

### Updating Service Worker

When deploying a new version:

1. Run `npm run build` (automatically updates service-worker.js)
2. Upload new `dist/service-worker.js` to server
3. Users will be prompted to refresh on next visit
4. Service worker automatically updates cache

**Force Update** (User devices):

In browser console:

```javascript
navigator.serviceWorker.getRegistrations().then((registrations) => {
  registrations.forEach((reg) => reg.unregister());
});
location.reload();
```

---

## Health Check Procedures

### Pre-Deployment Health Checks

**Server Connectivity**:

```bash
# Verify server is reachable
ping production-server

# Verify SSH access
ssh user@production-server echo "Connection successful"

# Verify disk space
ssh user@production-server "df -h | grep /var"
```

**Web Server Status**:

```bash
# Check web server is running
ssh user@production-server "sudo systemctl status nginx"
# OR
ssh user@production-server "sudo systemctl status apache2"

# Check web server is listening on ports 80/443
ssh user@production-server "sudo netstat -tlnp | grep -E ':80|:443'"
```

### Post-Deployment Health Checks

**Application Endpoint Tests**:

```bash
# Test HTTP redirect to HTTPS
curl -I http://accounting.yourdomain.com/
# Expected: 301 redirect to https://

# Test HTTPS endpoint
curl -I https://accounting.yourdomain.com/
# Expected: 200 OK

# Test gzip compression
curl -I -H "Accept-Encoding: gzip" https://accounting.yourdomain.com/
# Expected: Content-Encoding: gzip

# Test service worker
curl https://accounting.yourdomain.com/service-worker.js
# Expected: Valid JavaScript with workbox references
```

**Application Functionality Tests**:

```bash
# Load application
curl https://accounting.yourdomain.com/index.html | head -50
# Expected: HTML content, no error messages

# Check for common issues
curl https://accounting.yourdomain.com/ 2>&1 | grep -i "error\|fail\|exception"
# Expected: No matches (no errors)
```

**Browser Testing**:

1. Open https://accounting.yourdomain.com/ in browser
2. Press F12 (DevTools)
3. Check Console for errors (should be empty or warnings only)
4. Check Network tab:
   - All resources should be 200 OK
   - Service worker should be registered
   - index.html should have `no-cache` headers
   - Assets should have `max-age=30d` headers

**Performance Checks**:

```bash
# Measure page load time
time curl https://accounting.yourdomain.com/index.html > /dev/null

# Expected: < 2 seconds for first load

# Check asset sizes
curl -sI -H "Accept-Encoding: gzip" https://accounting.yourdomain.com/assets/index-CVqWfzbS.js
# Expected: Content-Length should be ~102KB (gzipped)
```

### Automated Health Check Script

Create `health-check.sh`:

```bash
#!/bin/bash

DOMAIN="https://accounting.yourdomain.com"
TIMEOUT=5

echo "=== Zoe Accounting Health Check ==="
echo "Domain: $DOMAIN"
echo "Time: $(date)"
echo ""

# Check 1: HTTPS connectivity
echo "[1/5] Checking HTTPS connectivity..."
if curl -s -m $TIMEOUT "$DOMAIN/" > /dev/null; then
    echo "✅ HTTPS connectivity OK"
else
    echo "❌ HTTPS connectivity FAILED"
    exit 1
fi

# Check 2: HTTP redirect
echo "[2/5] Checking HTTP redirect..."
if curl -s -m $TIMEOUT -I "http://accounting.yourdomain.com/" | grep -q "301\|302"; then
    echo "✅ HTTP redirect OK"
else
    echo "❌ HTTP redirect FAILED"
fi

# Check 3: Service worker
echo "[3/5] Checking service worker..."
if curl -s -m $TIMEOUT "$DOMAIN/service-worker.js" | grep -q "workbox"; then
    echo "✅ Service worker OK"
else
    echo "⚠️  Service worker issue (may be OK if workbox not present)"
fi

# Check 4: Gzip compression
echo "[4/5] Checking gzip compression..."
if curl -s -m $TIMEOUT -H "Accept-Encoding: gzip" "$DOMAIN/" | file - | grep -q "gzip"; then
    echo "✅ Gzip compression OK"
else
    echo "⚠️  Gzip not enabled (check server config)"
fi

# Check 5: Security headers
echo "[5/5] Checking security headers..."
HEADERS=$(curl -s -m $TIMEOUT -I "$DOMAIN/")
if echo "$HEADERS" | grep -q "X-Content-Type-Options"; then
    echo "✅ Security headers OK"
else
    echo "⚠️  Some security headers missing (check server config)"
fi

echo ""
echo "=== Health Check Complete ==="
```

Run:

```bash
chmod +x health-check.sh
./health-check.sh
```

---

## Rollback Procedures

### Pre-Rollback Decision Criteria

**Rollback if any of these occur**:

- ❌ Application shows blank page / 404 errors
- ❌ Service Worker issues causing crashes
- ❌ Critical functionality unavailable
- ❌ Performance degradation > 50%
- ❌ Security vulnerabilities detected
- ❌ Database connectivity broken
- ❌ More than 10% error rate in logs

**Do NOT rollback if**:

- ✅ Minor UI inconsistencies
- ✅ Single feature not working (can be patched)
- ✅ Performance slightly slower (investigate first)
- ✅ New warnings in console (may be harmless)

### Rollback Method 1: Quick Swap (File-Based)

**Prerequisites**:

- Previous version backed up
- Backup directory: `/var/www/zoe-accounting-backup/`

**Execution**:

```bash
# SSH to server
ssh user@production-server

# Stop web server
sudo systemctl stop nginx
# OR
sudo systemctl stop apache2

# Backup current version
sudo cp -r /var/www/zoe-accounting /var/www/zoe-accounting-failed-$(date +%s)

# Restore previous version
sudo rm -rf /var/www/zoe-accounting/*
sudo cp -r /var/www/zoe-accounting-backup/* /var/www/zoe-accounting/

# Verify files
ls -la /var/www/zoe-accounting/

# Start web server
sudo systemctl start nginx
# OR
sudo systemctl start apache2

# Verify
curl https://accounting.yourdomain.com/index.html
```

### Rollback Method 2: Git-Based (Recommended)

**Prerequisites**:

- Git repository cloned on server
- Previous version tagged in Git

**Execution**:

```bash
# SSH to server
ssh user@production-server

# Navigate to repository
cd /path/to/git/repo

# List available versions/tags
git tag -l

# Checkout previous version
git checkout v1.0.0  # or commit hash

# Rebuild and deploy
npm install
npm run build

# Copy to web root
sudo cp -r dist/* /var/www/zoe-accounting/
sudo chown -r www-data:www-data /var/www/zoe-accounting/

# Restart web server
sudo systemctl restart nginx

# Verify
curl https://accounting.yourdomain.com/index.html
```

### Rollback Method 3: Docker-Based

```bash
# View deployment history
docker image history zoe-accounting:latest

# List available versions
docker images | grep zoe-accounting

# Switch to previous version
docker stop zoe-accounting
docker rm zoe-accounting

docker run -d \
  --name zoe-accounting \
  -p 80:80 \
  zoe-accounting:previous-version-tag

# Verify
curl http://localhost/index.html

# Check logs for issues
docker logs zoe-accounting
```

### Post-Rollback Validation

**Immediate Checks**:

```bash
# 1. Verify application loads
curl https://accounting.yourdomain.com/

# 2. Check browser console (no errors)
# Open in browser, press F12, check console

# 3. Verify service worker
curl https://accounting.yourdomain.com/service-worker.js

# 4. Test basic functionality manually
# - Load app in browser
# - Try to interact with features
# - Check network requests in DevTools
```

**Communication**:

1. Notify stakeholders of rollback
2. Provide status and ETA for fix
3. Document root cause for post-mortem
4. Schedule incident review meeting

---

## Post-Deployment Monitoring

### Metrics to Monitor

**Performance Metrics**:

| Metric                         | Target        | Alert Level |
| ------------------------------ | ------------- | ----------- |
| Page Load Time (P95)           | < 2 seconds   | > 5 seconds |
| Time to Interactive (TTI)      | < 3 seconds   | > 8 seconds |
| Largest Contentful Paint (LCP) | < 2.5 seconds | > 4 seconds |
| Cumulative Layout Shift (CLS)  | < 0.1         | > 0.25      |
| First Input Delay (FID)        | < 100ms       | > 300ms     |

**Application Metrics**:

| Metric            | Target           | Alert Level   |
| ----------------- | ---------------- | ------------- |
| Error Rate        | < 0.1%           | > 1%          |
| Success Rate      | > 99.9%          | < 99%         |
| 5xx Errors        | 0                | > 5 in 1 hour |
| 4xx Errors        | < 1% of requests | > 5%          |
| API Response Time | < 500ms          | > 2000ms      |

**Infrastructure Metrics**:

| Metric            | Target | Alert Level |
| ----------------- | ------ | ----------- |
| CPU Usage         | < 50%  | > 80%       |
| Memory Usage      | < 50%  | > 80%       |
| Disk Usage        | < 80%  | > 90%       |
| Network Bandwidth | < 50%  | > 90%       |

### Monitoring Tools Setup

**Web Server Logs**:

```bash
# Nginx access log
tail -f /var/log/nginx/access.log

# Apache access log
tail -f /var/log/apache2/access.log

# Parse common errors
grep "error" /var/log/nginx/error.log
grep "5[0-9][0-9]" /var/log/nginx/access.log  # 5xx errors
```

**Application Monitoring**:

Use tools like:

- Google Analytics (page views, user behavior)
- Sentry (error tracking)
- New Relic / Datadog (infrastructure monitoring)
- Grafana + Prometheus (custom metrics)

**Sample Monitoring Configuration** (Prometheus):

```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'zoe-accounting'
    static_configs:
      - targets: ['accounting.yourdomain.com:9090']
    metrics_path: '/metrics'
    scrape_interval: 15s
```

### Alert Configuration

**Critical Alerts** (Immediate notification):

```bash
# Alert: Application down
curl -s https://accounting.yourdomain.com/ || \
  send_alert "CRITICAL: Zoe Accounting application down"

# Alert: High error rate
ERROR_RATE=$(grep "5[0-9][0-9]" /var/log/nginx/access.log | wc -l)
if [ $ERROR_RATE -gt 50 ]; then
  send_alert "CRITICAL: High error rate detected ($ERROR_RATE errors)"
fi

# Alert: Disk space low
DISK_USAGE=$(df /var/www | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 90 ]; then
  send_alert "CRITICAL: Disk usage at ${DISK_USAGE}%"
fi
```

**Warning Alerts** (Notify support team):

```bash
# Alert: Slow response time
RESPONSE_TIME=$(curl -w "%{time_total}" -o /dev/null -s https://accounting.yourdomain.com/)
if (( $(echo "$RESPONSE_TIME > 5" | bc -l) )); then
  send_alert "WARNING: Slow response time (${RESPONSE_TIME}s)"
fi

# Alert: Service worker issues
if ! curl -s https://accounting.yourdomain.com/service-worker.js | grep -q "workbox"; then
  send_alert "WARNING: Service worker may have issues"
fi
```

### Dashboard Setup

Create monitoring dashboard showing:

- Application uptime
- Error rate (real-time)
- Page load times
- User count (if analytics enabled)
- Server resource usage
- API response times

---

## Troubleshooting Guide

### Issue: Application Shows Blank Page

**Symptoms**:

- Browser loads but shows nothing
- Console errors about React components

**Diagnosis**:

```bash
# 1. Check if HTML is served
curl https://accounting.yourdomain.com/index.html

# 2. Check for 404 errors
curl -I https://accounting.yourdomain.com/

# 3. Check browser console
# Press F12, look for JavaScript errors
```

**Solutions**:

1. **Verify index.html exists**:

   ```bash
   ls -la /var/www/zoe-accounting/index.html
   ```

2. **Check web server configuration**:
   - Verify `try_files $uri $uri/ /index.html;` in nginx
   - Verify mod_rewrite enabled in Apache

3. **Clear service worker cache**:

   ```javascript
   // In browser console
   caches.delete('workbox-cache-v1');
   location.reload();
   ```

4. **Check JavaScript console errors** (F12):
   - Look for 404s on JavaScript files
   - Look for CORS errors
   - Look for Supabase authentication errors

### Issue: 404 Errors on Assets

**Symptoms**:

- Application loads but assets (CSS, JS) missing
- Styling not applied

**Diagnosis**:

```bash
# Check if asset files exist
ls -la /var/www/zoe-accounting/assets/

# Check if assets are accessible
curl https://accounting.yourdomain.com/assets/index-CVqWfzbS.js

# Check file permissions
ls -la /var/www/zoe-accounting/assets/ | head
```

**Solutions**:

1. **Fix file permissions**:

   ```bash
   sudo chown -R www-data:www-data /var/www/zoe-accounting/
   sudo chmod -R 755 /var/www/zoe-accounting/
   ```

2. **Verify correct deployment**:

   ```bash
   # Count files
   ls /var/www/zoe-accounting/assets/ | wc -l
   # Should be 10 asset files
   ```

3. **Check web server logs for errors**:
   ```bash
   tail -f /var/log/nginx/error.log
   # Look for permission denied errors
   ```

### Issue: Service Worker Not Registering

**Symptoms**:

- DevTools → Application → Service Workers shows nothing
- Offline functionality not working

**Diagnosis**:

```bash
# Check service worker file exists
ls -la /var/www/zoe-accounting/service-worker.js

# Check if accessible
curl https://accounting.yourdomain.com/service-worker.js

# Check browser console for errors
# Press F12, look for service worker registration errors
```

**Solutions**:

1. **Verify HTTPS enabled** (service workers require HTTPS):

   ```bash
   curl -I https://accounting.yourdomain.com/
   # Should be 200, not 301/redirect
   ```

2. **Clear existing service workers**:

   ```javascript
   // In browser console
   navigator.serviceWorker.getRegistrations().then((regs) => {
     regs.forEach((reg) => reg.unregister());
   });
   location.reload();
   ```

3. **Check service worker file is valid**:
   ```bash
   curl https://accounting.yourdomain.com/service-worker.js | head -20
   # Should show valid JavaScript, not errors
   ```

### Issue: Supabase Connection Errors

**Symptoms**:

- Console shows "Failed to connect to Supabase"
- Cannot load or save data
- 401/403 errors to API

**Diagnosis**:

```bash
# Check if Supabase environment variables set
grep -i supabase /path/to/build/output.log

# Test Supabase connectivity
curl https://your-project.supabase.co/rest/v1/health
```

**Solutions**:

1. **Verify environment variables**:

   ```bash
   # Check in build output
   cat /var/www/zoe-accounting/index.html | grep -i supabase

   # Or check web server environment
   env | grep SUPABASE
   ```

2. **Regenerate Supabase URL/key**:
   - Log into Supabase dashboard
   - Settings → API
   - Regenerate if keys compromised
   - Update deployment

3. **Check CORS configuration**:
   - Supabase should allow your domain
   - Settings → Authentication → Allowed URLs

### Issue: Performance Degradation

**Symptoms**:

- Application loads slowly
- High server load
- Timeout errors

**Diagnosis**:

```bash
# Check server resources
ssh user@production-server "free -h"  # Memory
ssh user@production-server "top -b -n 1 | head -20"  # CPU

# Measure page load time
time curl https://accounting.yourdomain.com/index.html > /dev/null

# Check for cache headers
curl -I https://accounting.yourdomain.com/assets/index-CVqWfzbS.js
# Should show: Cache-Control: max-age=2592000
```

**Solutions**:

1. **Enable/verify caching headers**:

   ```nginx
   # In nginx config
   location ~* \.(js|css)$ {
     expires 30d;
     add_header Cache-Control "public, immutable";
   }
   ```

2. **Enable gzip compression**:

   ```nginx
   gzip on;
   gzip_min_length 1024;
   gzip_types text/plain text/css application/javascript;
   ```

3. **Increase server resources** if consistently high load:
   - Add CPU/RAM
   - Use load balancer
   - Implement CDN

### Issue: HTTPS Certificate Expired

**Symptoms**:

- Browser shows security warning
- "Not Secure" warning in address bar
- Certificate error in logs

**Diagnosis**:

```bash
# Check certificate expiry
openssl s_client -connect accounting.yourdomain.com:443 -showcerts < /dev/null | grep dates

# Expected output shows "notAfter" date in future
```

**Solutions**:

1. **Renew certificate using Let's Encrypt**:

   ```bash
   sudo certbot renew --force-renewal
   sudo systemctl reload nginx
   ```

2. **Update certificate path in web server config** if using new cert:
   ```bash
   sudo nginx -t  # Test config
   sudo systemctl reload nginx
   ```

### Issue: CORS Errors

**Symptoms**:

- Console shows "Cross-Origin Request Blocked"
- Network tab shows failed requests to Supabase

**Diagnosis**:

```bash
# Check CORS headers
curl -I -H "Origin: https://accounting.yourdomain.com" \
  https://your-project.supabase.co/rest/v1/health
```

**Solutions**:

1. **Configure Supabase CORS**:
   - Supabase dashboard → Settings → Authentication
   - Add your domain to "Allowed URLs"

2. **Configure web server CORS headers**:
   ```nginx
   add_header 'Access-Control-Allow-Origin' '*';
   add_header 'Access-Control-Allow-Methods' 'GET, POST, PUT, DELETE, OPTIONS';
   add_header 'Access-Control-Allow-Headers' 'Content-Type, Authorization';
   ```

### Emergency Troubleshooting Checklist

If application is down and you need quick diagnosis:

```bash
#!/bin/bash
echo "=== Emergency Troubleshooting ==="

# 1. Is the server running?
echo "1. Server Status:"
ssh user@server "systemctl status nginx" 2>&1 | head -5

# 2. Are files there?
echo "2. File Check:"
ssh user@server "ls -la /var/www/zoe-accounting/ | head"

# 3. Is it accessible?
echo "3. Accessibility:"
curl -I https://accounting.yourdomain.com/ 2>&1 | head -5

# 4. What errors?
echo "4. Recent Errors:"
ssh user@server "tail -20 /var/log/nginx/error.log"

# 5. Server resources?
echo "5. Resources:"
ssh user@server "free -h && df -h"
```

---

## Emergency Contacts & Escalation

### Primary Contacts

| Role                         | Name      | Phone   | Email   | Available      |
| ---------------------------- | --------- | ------- | ------- | -------------- |
| **DevOps Lead**              | [Name]    | [Phone] | [Email] | 24/7           |
| **Lead Developer**           | [Name]    | [Phone] | [Email] | Business hours |
| **Supabase Account Manager** | [Name]    | [Phone] | [Email] | Business hours |
| **Hosting Provider Support** | [Support] | [Phone] | [Email] | 24/7           |

### Escalation Policy

**Level 1: Application Down (Critical)**

- **Detection**: Application returns 5xx errors or fails health check
- **Response Time**: 15 minutes
- **Action**: Contact DevOps Lead + On-call Engineer
- **Communication**: Update status every 15 minutes

**Level 2: Degraded Performance (High)**

- **Detection**: Error rate > 5% OR response time > 5 seconds
- **Response Time**: 1 hour
- **Action**: Contact DevOps Lead
- **Communication**: Update status every 30 minutes

**Level 3: Minor Issues (Medium)**

- **Detection**: Single feature broken or non-critical errors
- **Response Time**: 4 hours
- **Action**: Create ticket and assign to developer
- **Communication**: Update daily

**Level 4: Questions / Guidance (Low)**

- **Detection**: How to use, configuration questions
- **Response Time**: 24 hours
- **Action**: Document in wiki or FAQ
- **Communication**: As needed

### Communication Channels

| Severity     | Slack Channel | Email                | Phone    |
| ------------ | ------------- | -------------------- | -------- |
| Critical (1) | #incidents    | ops-team@company.com | [Number] |
| High (2)     | #incidents    | ops-team@company.com | -        |
| Medium (3)   | #general      | dev-team@company.com | -        |
| Low (4)      | #questions    | -                    | -        |

### Post-Incident Review

After any significant incident:

1. **Create incident report** within 24 hours
2. **Identify root cause** through logs and metrics
3. **Document what happened** (timeline)
4. **Determine fix** or workaround
5. **Schedule post-mortem meeting** (within 3 days)
6. **Prevent recurrence** with process changes or monitoring

### Deployment Rollback Authority

| Severity                      | Who Can Rollback | Approval Required  |
| ----------------------------- | ---------------- | ------------------ |
| Critical Application Down     | DevOps Lead      | None (immediate)   |
| Degraded Performance > 1 hour | DevOps Lead      | None (immediate)   |
| Minor Regressions             | DevOps Lead      | Tech Lead approval |
| Cosmetic Issues               | DevOps Lead      | Tech Lead approval |

---

## Appendix: Quick Reference

### Deployment Commands Quick Reference

```bash
# Build locally
npm install && npm run build

# Deploy via SCP
scp -r dist/* user@server:/var/www/zoe-accounting/

# Deploy via rsync
rsync -avz dist/ user@server:/var/www/zoe-accounting/

# SSH to server
ssh user@production-server

# Check web server status
sudo systemctl status nginx

# Restart web server
sudo systemctl restart nginx

# View logs
tail -f /var/log/nginx/error.log

# Health check
curl https://accounting.yourdomain.com/
```

### Monitoring Commands Quick Reference

```bash
# Check page load
curl -w "@curl-format.txt" -o /dev/null -s https://accounting.yourdomain.com/

# Monitor logs in real-time
tail -f /var/log/nginx/access.log

# Count errors
grep "5[0-9][0-9]" /var/log/nginx/access.log | wc -l

# Test gzip
curl -H "Accept-Encoding: gzip" https://accounting.yourdomain.com/ | file -

# Check certificate
openssl s_client -connect accounting.yourdomain.com:443 < /dev/null
```

### Environment Variables Reference

```bash
# Required
REACT_APP_SUPABASE_URL="https://your-project.supabase.co"
REACT_APP_SUPABASE_KEY="your-anon-key"

# Optional
REACT_APP_DEBUG="false"
REACT_APP_ENABLE_ANALYTICS="true"
```

---

## Version History

| Version | Date     | Changes                  |
| ------- | -------- | ------------------------ |
| 1.0     | Feb 2026 | Initial production guide |

---

**Document Status**: ✅ **READY FOR DEPLOYMENT**

**Last Updated**: February 2026  
**Approved By**: Development Team  
**Next Review**: 30 days after deployment
