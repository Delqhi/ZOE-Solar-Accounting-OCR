# 🛠️ SOLUTION: Fix Document Display Issue

## Problem
**"Es werden keine Belege angezeigt von den tausenden"**  
The application shows no documents despite having thousands in the database.

## Root Cause
**Supabase backend is unreachable** - the database connection times out, so documents cannot be loaded.

## Quick Fix (5 Minutes)

### Step 1: Check Supabase Project Status
1. Go to **https://supabase.com/dashboard**
2. Login with your credentials
3. Look for project named `aura-call.de` or similar
4. **Check if project is:**
   - ✅ **Active** → Continue to Step 2
   - ❌ **Suspended/Deleted** → Create new project (Step 5)

### Step 2: Get Correct Supabase Credentials
In Supabase Dashboard:
1. Click on your project
2. Go to **Project Settings → API**
3. Copy these values:
   - **URL**: Should look like `https://xyz.supabase.co`
   - **anon public** key: Long string starting with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### Step 3: Update Vercel Environment Variables
1. Go to **https://vercel.com/dashboard**
2. Find project `zoe-solar-accounting-ocr`
3. Go to **Settings → Environment Variables**
4. Update these variables:
   ```
   VITE_SUPABASE_URL = https://xyz.supabase.co  ← NEW URL
   VITE_SUPABASE_ANON_KEY = eyJhbGci...         ← NEW KEY
   ```
5. **Save and Redeploy**

### Step 4: Verify Fix
After redeployment:
1. Open **https://zoe-solar-accounting-ocr.vercel.app**
2. Open **Developer Tools → Console**
3. Look for messages:
   - ✅ "Supabase client initialized"
   - ✅ "Loading documents..."
   - ✅ "Found X documents"
4. Check if documents appear in UI

### Step 5: If No Project Exists (Create New)
If Supabase project is deleted:

1. **Create New Project:**
   - Go to https://supabase.com/dashboard
   - Click "New Project"
   - Name: `zoe-solar-ocr`
   - Region: Choose closest (e.g., Frankfurt)
   - Create

2. **Create Database Table:**
   ```sql
   -- Run in SQL Editor
   CREATE TABLE belege (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     file_name TEXT,
     file_type TEXT,
     file_size INTEGER,
     uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     document_date DATE,
     type TEXT,
     total_amount DECIMAL(10,2),
     vat_amount DECIMAL(10,2),
     net_amount DECIMAL(10,2),
     creditor TEXT,
     vat_rate DECIMAL(5,2),
     iban TEXT,
     description TEXT,
     content TEXT,
     extracted_data JSONB,
     status TEXT DEFAULT 'pending',
     user_id TEXT,
     processing_time INTEGER,
     ai_confidence DECIMAL(5,4),
     ocr_engine TEXT,
     sync_status TEXT DEFAULT 'synced',
     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
     updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Get Credentials & Update Vercel** (Step 2 & 3 above)

## Alternative: Local-Only Mode (No Supabase)

If you want to test without Supabase:

### Modify `src/services/supabaseService.ts`
```typescript
// Add this function for local-only mode
export function isSupabaseConfigured(): boolean {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  // Return false to force local-only mode
  return false; // Set to true to enable Supabase
}

// Modify getAllDocuments to handle local-only
export async function getAllDocuments(options?: QueryOptions): Promise<DocumentRecord[]> {
  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase not configured - using local storage only');
    // Return empty array - app will show empty state
    // Or implement IndexedDB-only logic here
    return [];
  }
  // ... existing Supabase code
}
```

### Build & Deploy
```bash
npm run build
vercel --prod
```

## Verification Commands

### Test Supabase Connection
```bash
# Run the test script
node test-supabase-connection.js

# Expected output if working:
# ✅ Connection successful
# ✅ Found X documents in database
# ✅ Schema validation passed
```

### Check Deployed App
```bash
# Check if app loads
curl -s https://zoe-solar-accounting-ocr.vercel.app | grep -i "loading\|error"

# Check CSS is correct
curl -s https://zoe-solar-accounting-ocr.vercel.app/assets/index-*.css | grep "color-background"
```

## Expected Results After Fix

### ✅ Working State
```
Browser Console:
✅ Supabase client initialized
✅ Loading documents from database...
✅ Found 1247 documents
✅ Documents loaded successfully

UI:
✅ Header: "1,247 Documents"
✅ Table: Shows all documents
✅ Search: Works
✅ Filters: Work
```

### ❌ Current State (Broken)
```
Browser Console:
❌ Connection timeout to supabase.aura-call.de
⚠️  No documents found
ℹ️  Using empty state

UI:
✅ Header: "0 Documents"
❌ Table: Empty
❌ User: Confused
```

## Quick Status Check

### What's Fixed
- ✅ **CSS Layout**: Dark theme working
- ✅ **Build**: No errors
- ✅ **Deployment**: Live on Vercel
- ✅ **Frontend**: Code is correct

### What's Broken
- ❌ **Supabase Connection**: Timeout
- ❌ **Data Loading**: Returns empty
- ❌ **Document Display**: Shows 0 documents

### What You Need To Do
1. **Check Supabase Dashboard** (2 min)
2. **Update credentials in Vercel** (2 min)
3. **Redeploy** (1 min)
4. **Verify documents appear** (1 min)

**Total time: ~5-10 minutes**

## Support Information

### If Issues Persist
1. **Check Vercel Logs**: https://vercel.com/zoe-solar-accounting-ocr/logs
2. **Check Supabase Logs**: Dashboard → Logs → API
3. **Test Connection**: Run `test-supabase-connection.js`

### Common Issues
- **Project suspended**: Check billing status in Supabase
- **Wrong URL**: Should be `*.supabase.co`, not `*.aura-call.de`
- **Wrong key**: Must be anon public key, not service role
- **CORS issues**: Supabase handles this automatically

## Summary

**The CSS is fixed and deployed.**  
**The documents aren't showing because Supabase is unreachable.**  
**Fix: Update Supabase credentials in Vercel → Redeploy → Done.**