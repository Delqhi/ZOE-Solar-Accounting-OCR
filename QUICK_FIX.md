# 🚨 QUICK FIX: Supabase Connection Issue

## Problem
**Documents not loading in deployed app** because Vercel has wrong Supabase URL.

## Root Cause
```
❌ Current (Vercel):  VITE_SUPABASE_URL = http://localhost:8000
✅ Required (Prod):   VITE_SUPABASE_URL = https://supabase.aura-call.de
```

## Solution (Choose One)

### Option 1: Automated Script (Recommended - 5 minutes)
```bash
cd /Users/jeremy/conductor/repos/zoe-solar-accounting-ocr
./fix-supabase-deploy.sh
```

### Option 2: Manual Vercel Dashboard (3 minutes)
1. Go to: https://vercel.com/zoe-solar-accounting-ocr/settings/environment-variables
2. Update `VITE_SUPABASE_URL`:
   - **Old:** `http://localhost:8000`
   - **New:** `https://supabase.aura-call.de`
3. Click "Save"
4. Go to "Deployments" tab
5. Click "Redeploy" on latest deployment

### Option 3: Vercel CLI Commands (5 minutes)
```bash
# 1. Remove old .vercel directory
rm -rf .vercel

# 2. Link to project
vercel link --yes --scope=team_VTipbYr7L5qhqXdu38e0Z0OL

# 3. Update environment
vercel env add VITE_SUPABASE_URL production
# Enter: https://supabase.aura-call.de

# 4. Redeploy
vercel deploy --prod
```

## Verification

### After Fix:
```bash
# Test connection
node test-supabase-connection.js

# Expected output:
# ✅ Connection successful
# ✅ Found X documents in database
# ✅ Schema validation passed
```

### Check Deployed App:
1. Open: https://zoe-solar-accounting-ocr.vercel.app
2. Press F12 → Console
3. Should see: `🔄 Found X documents`

## Why This Happened
- `.env.local` had `localhost:8000` (local development)
- Vercel inherited this value
- Localhost isn't reachable from Vercel's cloud
- Result: Connection timeout → Empty document list

## Current Status
- ✅ Code: Production-ready
- ✅ CSS: Fixed and deployed
- ✅ Build: Successful
- ⚠️ Environment: Needs update
- ⚠️ Documents: Won't load until fixed

## Expected Result After Fix
```
✅ Documents appear in UI
✅ All 12 console log categories working
✅ Full logging infrastructure active
✅ Production-ready application
```

**Time to fix: 3-5 minutes**
**Difficulty: Easy**
**Risk: None** (just environment variable update)

---

**Ready to fix?** Run: `./fix-supabase-deploy.sh`
