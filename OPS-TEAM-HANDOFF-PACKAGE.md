# OPS-TEAM-HANDOFF-PACKAGE.md

**Project**: Zoe Solar Accounting OCR  
**Version**: 1.0.0-production-ready  
**Date**: February 2026  
**Audience**: Operations Team, DevOps Engineers, System Administrators

---

## 📋 OPERATIONS TEAM QUICK START GUIDE

Welcome to the Zoe Solar Accounting OCR production deployment handoff package. This document provides everything your operations team needs to deploy, manage, and support this application in production.

### What You're Receiving

This handoff includes:

- ✅ Production-ready build artifacts (12 verified files in `/dist/`)
- ✅ Complete deployment guide with 40+ commands and configurations
- ✅ Comprehensive project completion report documenting all phases
- ✅ Field catalog documentation (K1.md - 24 fields)
- ✅ This operations team quick reference

### Key Deliverables Overview

| Deliverable            | Purpose                            | Location                        | Size                       |
| ---------------------- | ---------------------------------- | ------------------------------- | -------------------------- |
| **Build Artifacts**    | Production-ready compiled code     | `/dist/`                        | 12 files, 295 kB (gzipped) |
| **Deployment Guide**   | Detailed deployment instructions   | `DEPLOYMENT-GUIDE.md`           | 950 lines, 40+ commands    |
| **Completion Report**  | Project phases 1-30 summary        | `PHASE-30-COMPLETION-REPORT.md` | 280+ lines                 |
| **Completion Summary** | Executive summary for stakeholders | `PROJECT-COMPLETION-SUMMARY.md` | 250 lines                  |
| **Field Catalog**      | K1 field documentation             | `K1.md`                         | 85 lines, 24 fields        |

### Getting Started (5 Minutes)

1. **Read This Document** (you are here) → 5 minutes
2. **Review DEPLOYMENT-GUIDE.md** (quick reference sections only) → 10 minutes
3. **Complete the Customization Checklist Below** → 15 minutes
4. **Follow Deployment Instructions** from DEPLOYMENT-GUIDE.md → varies

**Total Pre-Deployment Time**: ~30 minutes

---

## ✅ OPERATIONS TEAM CUSTOMIZATION CHECKLIST

**IMPORTANT**: Before proceeding with deployment, complete ALL items below. Each item requires your team to replace placeholder values with actual production values.

### Section A: Domain & Network Configuration

- [ ] **Replace Production Domain**
  - Find: `accounting.yourdomain.com` (throughout all configs)
  - Replace with: Your actual production domain (e.g., `accounting.company.com`)
  - Files affected: DEPLOYMENT-GUIDE.md, nginx config, SSL config, environment files
  - Responsibility: Network/DevOps Engineer

- [ ] **Configure SSL/TLS Certificates**
  - Obtain certificates from your certificate authority (Let's Encrypt recommended)
  - Update certificate paths in nginx configuration
  - Set certificate renewal (auto-renewal recommended)
  - Verify certificate validity: `openssl x509 -in cert.pem -text -noout`
  - Responsibility: Security/DevOps Engineer

- [ ] **Configure Firewall Rules**
  - Allow HTTPS (port 443) from your users
  - Allow SSH (port 22) from admin IPs only
  - Allow deployment callbacks (if automated)
  - Block all other inbound traffic
  - Responsibility: Network Security Engineer

### Section B: Team & Contact Information

- [ ] **Update Deployment Coordinator**
  - Name: [REPLACE WITH ACTUAL NAME]
  - Email: [REPLACE WITH ACTUAL EMAIL]
  - Phone: [REPLACE WITH ACTUAL PHONE]
  - Responsibility: DevOps Manager

- [ ] **Update Emergency Contacts**
  - Primary On-Call: [NAME] - [PHONE] - [EMAIL]
  - Secondary On-Call: [NAME] - [PHONE] - [EMAIL]
  - Escalation Manager: [NAME] - [PHONE] - [EMAIL]
  - Responsibility: Operations Manager

- [ ] **Update Team Assignments**
  - Deployment Lead: [NAME] - [EMAIL]
  - Database Administrator: [NAME] - [EMAIL]
  - System Administrator: [NAME] - [EMAIL]
  - Application Support: [NAME] - [EMAIL]
  - Responsibility: Operations Manager

- [ ] **Update Communication Channels**
  - Primary Slack Channel: [REPLACE WITH CHANNEL]
  - Emergency Alert Channel: [REPLACE WITH CHANNEL]
  - Incident Response Channel: [REPLACE WITH CHANNEL]
  - Responsibility: Ops Manager

### Section C: Database & Services Configuration

- [ ] **Configure Supabase Connection**
  - Supabase Project URL: [REPLACE WITH YOUR URL]
  - Supabase API Key: [STORED IN VAULT - DO NOT PASTE HERE]
  - Database Password: [STORED IN VAULT - DO NOT PASTE HERE]
  - Connection Pool Settings: Review and adjust for your traffic
  - Responsibility: Database Administrator

- [ ] **Configure Database Backups**
  - Backup Schedule: [SET YOUR PREFERRED TIME]
  - Backup Retention: [SET YOUR PREFERRED DAYS]
  - Backup Location: [SET YOUR BACKUP STORAGE]
  - Verify backup restoration: [SCHEDULE TEST]
  - Responsibility: Database Administrator

- [ ] **Configure Monitoring & Alerts**
  - Monitoring Tool: [REPLACE WITH YOUR TOOL]
  - Alert Recipients: [UPDATE EMAIL ADDRESSES]
  - Alert Thresholds: Review defaults and adjust
  - Dashboard URL: [YOUR MONITORING DASHBOARD]
  - Responsibility: DevOps Engineer

### Section D: Deployment Configuration

- [ ] **Set Deployment Path**
  - Deployment Directory: [REPLACE `/var/www/zoe-accounting/`]
  - Log Directory: [REPLACE LOG PATH]
  - Backup Directory: [REPLACE BACKUP PATH]
  - Upload Directory: [REPLACE UPLOAD PATH]
  - Responsibility: DevOps Engineer

- [ ] **Configure Application Environment**
  - NODE_ENV: `production`
  - API Base URL: [YOUR PRODUCTION API URL]
  - Frontend URL: [YOUR PRODUCTION FRONTEND URL]
  - Timeout Values: Review and adjust for your network
  - Responsibility: DevOps Engineer

- [ ] **Configure Deployment Script**
  - Update Git repository URL (if using private repo)
  - Update deployment user and permissions
  - Test deployment script on staging first
  - Configure deployment hooks (if needed)
  - Responsibility: DevOps Engineer

### Section E: Security & Compliance

- [ ] **Enable HTTPS Enforcement**
  - Redirect all HTTP to HTTPS
  - Enable HSTS headers
  - Verify SSL configuration: `curl -I https://accounting.yourdomain.com`
  - Responsibility: Security Engineer

- [ ] **Configure Authentication**
  - Review Supabase authentication settings
  - Enable MFA if required by your policy
  - Configure session timeout
  - Review and adjust password policies
  - Responsibility: Security Engineer

- [ ] **Set Up Access Logging**
  - Enable nginx access logs
  - Enable application logs
  - Configure log rotation
  - Set up log aggregation (optional but recommended)
  - Responsibility: System Administrator

- [ ] **Configure Data Encryption**
  - Verify encryption in transit (HTTPS)
  - Verify encryption at rest (database)
  - Review encryption keys and rotation policy
  - Document encryption configuration
  - Responsibility: Security Engineer

### Section F: Monitoring & Health Checks

- [ ] **Configure Health Check Endpoint**
  - Endpoint: `https://accounting.yourdomain.com/health`
  - Expected Response: `{"status": "ok"}`
  - Frequency: Every 60 seconds
  - Timeout: 10 seconds
  - Responsibility: DevOps Engineer

- [ ] **Set Up Uptime Monitoring**
  - Service: [YOUR UPTIME MONITORING TOOL]
  - Check Frequency: Every 5 minutes recommended
  - Alert Threshold: After 2 consecutive failures
  - Alert Recipients: [YOUR ALERT EMAIL]
  - Responsibility: DevOps Engineer

- [ ] **Configure Performance Monitoring**
  - Application Performance Monitor: [YOUR TOOL]
  - Response Time Threshold: <200ms (P95)
  - Error Rate Threshold: <0.1%
  - Dashboard: [YOUR DASHBOARD URL]
  - Responsibility: DevOps Engineer

- [ ] **Set Up Resource Monitoring**
  - CPU Threshold: Alert if > 80%
  - Memory Threshold: Alert if > 85%
  - Disk Threshold: Alert if > 90%
  - Network Threshold: Alert if > 80% capacity
  - Responsibility: System Administrator

### Section G: Backup & Disaster Recovery

- [ ] **Configure Automated Backups**
  - Backup Type: Full daily + hourly incremental
  - Retention Period: 30 days minimum
  - Backup Location: Off-site storage recommended
  - Test restore: [SCHEDULE DATE]
  - Responsibility: Database Administrator

- [ ] **Document Recovery Procedures**
  - RTO (Recovery Time Objective): [YOUR SLA]
  - RPO (Recovery Point Objective): [YOUR SLA]
  - Recovery procedure document: [LINK TO DOCUMENT]
  - Test recovery: [SCHEDULE QUARTERLY]
  - Responsibility: Disaster Recovery Lead

### Section H: Post-Deployment Verification

- [ ] **Verify Deployment Success**
  - [ ] Application loads at `https://accounting.yourdomain.com`
  - [ ] Login page displays correctly
  - [ ] HTTPS certificate is valid
  - [ ] Performance is acceptable (<200ms)
  - Responsibility: DevOps Engineer + QA

- [ ] **Verify Database Connection**
  - [ ] Database connections are healthy
  - [ ] Queries execute within expected time
  - [ ] Connection pool is functioning
  - Responsibility: Database Administrator

- [ ] **Verify Monitoring & Alerts**
  - [ ] All monitoring tools report healthy
  - [ ] Alert notifications are working
  - [ ] Dashboards display correctly
  - Responsibility: DevOps Engineer

---

## 🚀 QUICK REFERENCE CARDS

### Card 1: Essential Deployment Commands

```bash
# 1. SSH into deployment server
ssh -i ~/.ssh/deployment_key ops@production-server.com

# 2. Navigate to deployment directory
cd /var/www/zoe-accounting/

# 3. Pull latest build artifacts
aws s3 cp s3://your-artifacts/dist.tar.gz . && tar -xzf dist.tar.gz

# 4. Install dependencies
npm ci --production

# 5. Run database migrations (if any)
npm run migrate:production

# 6. Start application
pm2 start ecosystem.config.js --env production

# 7. Verify application is running
curl -s http://localhost:3000/health | jq .
```

**Use Case**: Initial deployment or emergency restart

---

### Card 2: Health Check Commands

```bash
# Check application health
curl -I https://accounting.yourdomain.com/health
# Expected: HTTP/1.1 200 OK

# Check database connectivity
npm run health:database
# Expected: Database connection successful

# Check all services
npm run health:full
# Expected: All services passing

# View application logs
pm2 logs zoe-accounting --lines 100
# Look for: No ERROR entries in recent logs

# Check system resources
free -h  # Memory
df -h    # Disk
top -bn1 | head -20  # CPU
```

**Use Case**: Verify application is healthy after deployment or when users report issues

---

### Card 3: Troubleshooting Quick Commands

```bash
# Restart application
pm2 restart zoe-accounting

# View error logs
pm2 logs zoe-accounting --err
# or
tail -f /var/log/zoe-accounting/error.log

# Check process status
pm2 status

# Clear application cache (if applicable)
npm run cache:clear

# View database connection pool
npm run health:database:verbose

# Check nginx configuration
sudo nginx -t

# Reload nginx (without downtime)
sudo nginx -s reload

# View recent deployments
git log --oneline -10
```

**Use Case**: Troubleshoot common issues without escalation

---

### Card 4: Monitoring & Observability

```bash
# View real-time application metrics
pm2 web  # Access at http://localhost:9615

# Check application error rate
curl -s https://accounting.yourdomain.com/metrics | grep error_rate

# Monitor database performance
npm run monitor:database

# View slow queries
npm run queries:slow

# Check cache hit rate
npm run monitor:cache

# View API response times
npm run monitor:api
```

**Use Case**: Monitor application performance and identify bottlenecks

---

### Card 5: Rollback Procedures

```bash
# Identify previous version
git log --oneline -5

# Checkout previous version
git checkout <previous-commit-hash>

# Rebuild application
npm run build

# Deploy previous version
./scripts/deploy-production.sh

# Verify rollback successful
curl -I https://accounting.yourdomain.com/health

# Alert stakeholders
# Send message to [SLACK_CHANNEL]: "Rolled back to version X due to [REASON]"
```

**Use Case**: Emergency rollback if new deployment introduces critical issues

---

### Card 6: Database Operations

```bash
# Create backup
./scripts/backup-database.sh

# Restore from backup
./scripts/restore-database.sh backup_2026_02_15.sql.gz

# Run database migrations
npm run migrate:production

# Check database status
npm run health:database:verbose

# View database logs
tail -f /var/log/postgresql/postgresql.log

# Connect to database (for manual queries)
psql -h your-db-host -U your-db-user -d zoe-accounting
```

**Use Case**: Manage database backups and handle data-related issues

---

## ❓ FREQUENTLY ASKED QUESTIONS (FAQ)

### Q1: How do I deploy the application?

**A**: Follow the "Initial Deployment" section in DEPLOYMENT-GUIDE.md. The process takes approximately 30-45 minutes for the initial setup.

### Q2: The application is slow. What should I check first?

**A**:

1. Check system resources: `free -h && df -h && top`
2. Check database performance: `npm run health:database:verbose`
3. Check error logs: `pm2 logs zoe-accounting --err`
4. Check response times: `npm run monitor:api`

If issues persist, escalate to DevOps Engineer.

### Q3: Users report 502 Bad Gateway errors. What's happening?

**A**:

1. Check if application is running: `pm2 status`
2. Check application logs: `pm2 logs zoe-accounting --err`
3. Check nginx logs: `tail -f /var/log/nginx/error.log`
4. Check server resources: `free -h && df -h`

If application crashed, restart: `pm2 restart zoe-accounting`

### Q4: How often should we backup the database?

**A**: Daily full backups + hourly incremental backups recommended. This provides good balance between storage and recovery options. Adjust based on your company's data retention policy.

### Q5: What's the expected response time?

**A**: P95 response time should be <200ms for most operations. If slower, check system resources and database performance.

### Q6: How do I update the application?

**A**:

1. Notify users of upcoming maintenance window
2. Follow deployment procedure in DEPLOYMENT-GUIDE.md
3. Run health checks to verify new version
4. Notify users when complete

**Never deploy during peak usage hours.**

### Q7: Can I deploy without downtime?

**A**: Yes, using blue-green deployment or load balancer with multiple instances. See "Zero-Downtime Deployment" in DEPLOYMENT-GUIDE.md.

### Q8: What should I do if a critical bug is discovered in production?

**A**:

1. Assess severity (is it affecting users?)
2. If critical: Execute rollback (Card 5 above)
3. If non-critical: Schedule fix for next release
4. Document incident for post-mortem

### Q9: How do I add new team members to the on-call rotation?

**A**: Contact your DevOps Manager to add to: PagerDuty, Slack alerts, and emergency contact list.

### Q10: Where do I find detailed technical information?

**A**: See "Key References" section below.

---

## 📞 CONTACT INFORMATION & ESCALATION PROCEDURES

### Emergency Contacts (24/7)

| Role                   | Name   | Phone   | Email   | Escalation Level       |
| ---------------------- | ------ | ------- | ------- | ---------------------- |
| **Primary On-Call**    | [NAME] | [PHONE] | [EMAIL] | Critical Issues        |
| **Secondary On-Call**  | [NAME] | [PHONE] | [EMAIL] | If Primary unavailable |
| **Escalation Manager** | [NAME] | [PHONE] | [EMAIL] | Major incidents        |

### Escalation Procedure

**Severity Assessment**:

- 🔴 **Critical** (users cannot work): Immediate escalation to On-Call
- 🟡 **High** (significant impact): Contact Escalation Manager
- 🟢 **Medium** (minor impact): Log ticket, handle during business hours
- 🔵 **Low** (informational): Document for next sprint

**Escalation Contacts**:

1. **Immediate**: Contact Primary On-Call (phone)
2. **If unavailable (5 mins)**: Contact Secondary On-Call
3. **Still unavailable (10 mins)**: Contact Escalation Manager
4. **Document**: Create incident ticket in your tracking system

### Team Assignments

| Function                | Name   | Email   | Availability    |
| ----------------------- | ------ | ------- | --------------- |
| **DevOps Lead**         | [NAME] | [EMAIL] | Mon-Fri 8am-6pm |
| **Database Admin**      | [NAME] | [EMAIL] | Mon-Fri 9am-5pm |
| **System Admin**        | [NAME] | [EMAIL] | Mon-Fri 8am-5pm |
| **Application Support** | [NAME] | [EMAIL] | Mon-Fri 9am-5pm |

### Communication Channels

| Channel                          | Purpose                   | Frequency        |
| -------------------------------- | ------------------------- | ---------------- |
| **Slack #zoe-accounting**        | Daily updates & questions | Real-time        |
| **Slack #zoe-accounting-alerts** | Automated alerts          | Real-time        |
| **Slack #incidents**             | Incident response         | During incidents |
| **Email: ops-team@company.com**  | Formal notifications      | As needed        |

---

## 🔗 KEY REFERENCES & DOCUMENTATION

### Complete Documentation

| Document                          | Purpose                            | Length     | Location     |
| --------------------------------- | ---------------------------------- | ---------- | ------------ |
| **DEPLOYMENT-GUIDE.md**           | Detailed deployment procedures     | 950 lines  | Project root |
| **PHASE-30-COMPLETION-REPORT.md** | Project completion summary         | 280+ lines | Project root |
| **PROJECT-COMPLETION-SUMMARY.md** | Executive summary for stakeholders | 250 lines  | Project root |
| **K1.md**                         | Field catalog documentation        | 85 lines   | Project root |

### How to Use These Documents

1. **DEPLOYMENT-GUIDE.md** - Primary reference for all operational tasks
   - Use "Initial Deployment" section for first-time setup
   - Use "Routine Maintenance" section for regular tasks
   - Use "Troubleshooting" section when issues arise

2. **PHASE-30-COMPLETION-REPORT.md** - Understand what was delivered
   - Shows all phases completed
   - Documents all features implemented
   - Lists all deliverables and artifacts

3. **PROJECT-COMPLETION-SUMMARY.md** - Share with leadership/stakeholders
   - Executive overview suitable for management review
   - Summarizes key achievements
   - Provides go-live readiness confirmation

4. **K1.md** - Reference for field definitions
   - Field names and data types
   - Field validation rules
   - Field descriptions

### Architecture Documentation

- **System Architecture**: See Section 3 in DEPLOYMENT-GUIDE.md
- **Database Schema**: See K1.md
- **API Endpoints**: See DEPLOYMENT-GUIDE.md Section 7
- **Configuration Options**: See DEPLOYMENT-GUIDE.md Section 5

### Training & Support

- **Need deployment help?** → Follow DEPLOYMENT-GUIDE.md
- **Need to understand the project?** → Read PHASE-30-COMPLETION-REPORT.md
- **Need field information?** → Reference K1.md
- **Need to brief leadership?** → Use PROJECT-COMPLETION-SUMMARY.md

---

## 📋 INTEGRATION NOTES

### How These Documents Work Together

```
PROJECT-COMPLETION-SUMMARY.md (Executive Overview)
         ↓
         ↓ Share with stakeholders/leadership
         ↓
PHASE-30-COMPLETION-REPORT.md (Technical Background)
         ↓
         ↓ Use for understanding project history
         ↓
DEPLOYMENT-GUIDE.md (Operational Playbook)
         ↓
         ↓ Follow step-by-step for deployment & management
         ↓
K1.md (Field Reference)
         ↓
         ↓ Use when working with data fields
         ↓
OPS-TEAM-HANDOFF-PACKAGE.md (This Document)
         ↓
         ↓ Use for team onboarding & quick reference
```

### Recommended Reading Order

1. **First**: This document (OPS-TEAM-HANDOFF-PACKAGE.md) - 15 minutes
2. **Then**: PROJECT-COMPLETION-SUMMARY.md - 10 minutes
3. **Then**: Customization Checklist (above) - 15 minutes
4. **Then**: DEPLOYMENT-GUIDE.md (as needed) - varies
5. **Reference**: K1.md (when working with data) - as needed

### Document Maintenance

- **Update Checklist**: Whenever production configuration changes
- **Update Contacts**: Whenever team composition changes
- **Update FAQs**: After resolving common issues
- **Archive Old Versions**: Keep in git history for reference

---

## ✅ NEXT STEPS FOR OPS TEAM

### Immediate Actions (Today)

1. ✅ **Assign Team Members**
   - Assign Deployment Lead
   - Assign Database Administrator
   - Assign Primary On-Call
   - Assign Secondary On-Call

2. ✅ **Complete Customization Checklist**
   - Fill in all placeholder values
   - Update all contact information
   - Configure all production settings
   - Store sensitive credentials in your vault

3. ✅ **Review Documentation**
   - Read this document: OPS-TEAM-HANDOFF-PACKAGE.md
   - Skim DEPLOYMENT-GUIDE.md
   - Bookmark K1.md for reference

### Preparation Phase (Before Deployment)

4. ⏳ **Prepare Infrastructure**
   - Provision servers/infrastructure
   - Configure networking and firewalls
   - Set up SSL certificates
   - Configure monitoring tools

5. ⏳ **Set Up Automation**
   - Configure automated backups
   - Set up monitoring and alerting
   - Configure health checks
   - Test automated deployment scripts

6. ⏳ **Conduct Team Training**
   - Train team on deployment procedures
   - Conduct disaster recovery drills
   - Review escalation procedures
   - Practice rollback procedures

### Deployment Phase (On Go-Live Date)

7. ⏳ **Execute Deployment**
   - Follow DEPLOYMENT-GUIDE.md exactly
   - Schedule deployment during maintenance window
   - Have rollback plan ready
   - Monitor deployment closely

8. ⏳ **Verify Deployment**
   - Run all health checks (Card 2 above)
   - Verify all monitoring is working
   - Confirm users can access application
   - Monitor error rates and performance

### Post-Deployment Phase (After Go-Live)

9. ⏳ **Handoff & Support**
   - Enable on-call rotation
   - Begin 24/7 support
   - Monitor for issues
   - Document any problems encountered

10. ⏳ **Optimize & Improve**
    - Monitor performance metrics
    - Identify optimization opportunities
    - Plan capacity upgrades if needed
    - Conduct post-incident reviews

---

## 🎯 SUCCESS CRITERIA

Your deployment is successful when:

- ✅ Application is accessible at `https://accounting.yourdomain.com`
- ✅ Login page loads without errors
- ✅ Database is connected and responsive
- ✅ All monitoring dashboards show healthy
- ✅ Health checks return 200 OK
- ✅ Response times are <200ms (P95)
- ✅ Error rate is <0.1%
- ✅ Backups are completing successfully
- ✅ Team can access all runbooks and documentation
- ✅ On-call rotation is active and responding

---

**Document Created**: February 2026  
**Version**: 1.0.0-production-ready  
**Last Updated**: February 13, 2026  
**Status**: ✅ Ready for Operations Team Use
