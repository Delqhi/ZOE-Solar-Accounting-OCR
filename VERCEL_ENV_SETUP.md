# Vercel Environment Variables Setup

## Required Environment Variables

The following environment variables must be set in Vercel for the application to function:

### Required (Application cannot work without these):

1. **VITE_SUPABASE_URL**
   - Description: Your Supabase project URL
   - Format: `https://xxxxx.supabase.co`
   - Where to find: Supabase Dashboard → Project Settings → API

2. **VITE_SUPABASE_ANON_KEY**
   - Description: Supabase anonymous API key
   - Format: `eyJhbGciOiJIUzI1NiIsInR5cC...`
   - Where to find: Supabase Dashboard → Project Settings → API → anon key

3. **VITE_GEMINI_API_KEY**
   - Description: Google Gemini API key for OCR
   - Format: `AIzaSy...`
   - Where to find: Google AI Studio → API Keys

4. **VITE_SILICONFLOW_API_KEY**
   - Description: SiliconFlow API key (OCR fallback)
   - Format: `sk-...`
   - Where to find: SiliconFlow Dashboard → API Keys

### Optional:

5. **VITE_SENTRY_DSN**
   - Description: Sentry error tracking
   - Format: `https://xxxxx.ingest.sentry.io/xxxxx`
   - Where to find: Sentry Dashboard → Project Settings → DSN

## How to Add Environment Variables

### Option 1: Using Vercel CLI

```bash
cd /Users/jeremy/conductor/workspaces/zoe-solar-accounting-ocr/yangon

# Add each variable interactively
vercel env add VITE_SUPABASE_URL production
# Enter value when prompted

vercel env add VITE_SUPABASE_ANON_KEY production
# Enter value when prompted

vercel env add VITE_GEMINI_API_KEY production
# Enter value when prompted

vercel env add VITE_SILICONFLOW_API_KEY production
# Enter value when prompted

# Verify
vercel env ls
```

### Option 2: Using Vercel Dashboard

1. Go to https://vercel.com/info-zukunftsories-projects/yangon
2. Click "Settings" tab
3. Click "Environment Variables"
4. Add each variable with "Production" environment
5. Click "Save"
6. Redeploy (or wait for automatic redeployment)

### Option 3: Using Vercel API (All at once)

```bash
# Save current directory
cd /Users/jeremy/conductor/workspaces/zoe-solar-accounting-ocr/yangon

# Set variables (replace placeholders with actual values)
vercel env add VITE_SUPABASE_URL production --value "your-supabase-url-here"
vercel env add VITE_SUPABASE_ANON_KEY production --value "your-supabase-anon-key-here"
vercel env add VITE_GEMINI_API_KEY production --value "your-gemini-api-key-here"
vercel env add VITE_SILICONFLOW_API_KEY production --value "your-siliconflow-api-key-here"

# Redeploy
vercel --prod --yes
```

## After Adding Variables

Once environment variables are added, the deployment will automatically redeploy within 1-2 minutes, or you can manually redeploy:

```bash
cd /Users/jeremy/conductor/workspaces/zoe-solar-accounting-ocr/yangon
vercel --prod --yes
```

## Verification

After redeployment, check:
1. https://yangon-2zit1r9as-info-zukunftsories-projects.vercel.app should return 200 (not 401)
2. Check logs: `vercel logs yangon-2zit1r9as-info-zukunftsories-projects.vercel.app`
3. Application should load without errors in browser console

## Security Notes

- Never commit `.env` file to git
- These variables are now stored securely in Vercel
- Rotate keys if they were ever exposed
- Monitor API usage in respective dashboards
