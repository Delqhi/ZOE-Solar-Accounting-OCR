# Supabase Connection Troubleshooting Guide

## Problem Summary

Your ZOE Solar Accounting OCR application is experiencing `ERR_CONNECTION_REFUSED` errors when trying to connect to Supabase at `https://supabase.aura-call.de`.

## Root Cause

The error `net::ERR_CONNECTION_REFUSED` indicates that:
1. The server at `supabase.aura-call.de` is not running
2. The domain doesn't exist or DNS is misconfigured
3. Firewall/security rules are blocking the connection
4. The Supabase services are not properly started

## Quick Solutions

### Option 1: Use Supabase Cloud (Recommended)

1. **Create a free Supabase project**:
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Click "New Project"
   - Choose a name and region
   - Click "Create New Project"

2. **Get your credentials**:
   - Go to Project Settings > API
   - Copy the `Project URL` and `anon public` key

3. **Update your `.env` file**:
   ```bash
   VITE_SUPABASE_URL=https://your-project-ref.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-from-dashboard
   ```

4. **Restart your development server**:
   ```bash
   npm run dev
   ```

### Option 2: Fix Self-Hosted Supabase

If you want to keep using your self-hosted instance:

1. **Check if Supabase is running**:
   ```bash
   # If using Docker Compose
   docker-compose ps

   # Check logs
   docker-compose logs supabase-studio
   ```

2. **Start/Restart Supabase services**:
   ```bash
   docker-compose up -d
   # or
   supabase start
   ```

3. **Test connectivity manually**:
   ```bash
   curl -I https://supabase.aura-call.de
   ```

4. **Check DNS resolution**:
   ```bash
   nslookup supabase.aura-call.de
   ping supabase.aura-call.de
   ```

## Diagnostic Tools

### Run the Diagnostic Script

I've created a diagnostic script to help troubleshoot:

```bash
# Install dependencies first
npm install dotenv

# Run the diagnostic
node check-supabase-connection.js
```

This will test:
- ✅ DNS resolution
- ✅ HTTP connectivity
- ✅ Authentication
- ✅ Table access

### Manual Testing

```bash
# Test basic connectivity
curl -I https://supabase.aura-call.de

# Test with authentication
curl "https://supabase.aura-call.de/rest/v1/" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"

# Test table access
curl "https://supabase.aura-call.de/rest/v1/einstellungen?select=schluessel&limit=1" \
  -H "apikey: YOUR_ANON_KEY" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

## Common Issues and Fixes

### 1. Domain Not Resolving
```
❌ DNS lookup failed: getaddrinfo ENOTFOUND supabase.aura-call.de
```
**Fix**: Check if the domain exists or use a different URL.

### 2. Connection Refused
```
❌ ECONNREFUSED: Connection refused
```
**Fix**: Start your Supabase instance or check firewall rules.

### 3. CORS Issues
```
❌ CORS policy blocked
```
**Fix**: Ensure CORS is enabled in your Supabase configuration.

### 4. Invalid Credentials
```
❌ 401 Unauthorized
```
**Fix**: Verify your anon key is correct and has proper permissions.

### 5. Table Not Found
```
⚠️  404 Table not found
```
**Fix**: Run database migrations:
```bash
supabase migration up
```

## Environment Variables Check

Your current `.env` should look like this:

```bash
# Required for OCR
VITE_GEMINI_API_KEY=AIzaSyBaH6sO1vVs14N1tZinSBG3QFtynF6OUWk

# Supabase Configuration
VITE_SUPABASE_URL=https://your-correct-url.supabase.co  # ← Update this
VITE_SUPABASE_ANON_KEY=your-correct-anon-key           # ← Update this

# Optional
VITE_GITLAB_* (your GitLab config)
```

## Testing the Fix

After updating your configuration:

1. **Clear browser cache and reload**
2. **Check browser console** for any remaining errors
3. **Verify the app works**:
   - Upload a document
   - Check if data appears in Supabase dashboard

## Application Behavior When Supabase is Unavailable

Your application is designed to gracefully handle Supabase failures:
- ✅ App continues to work in offline mode
- ✅ OCR processing still functions
- ✅ Data is cached locally
- ✅ Errors are logged but don't crash the app

## Getting Help

If these solutions don't work:

1. **Run the diagnostic script** and share the output
2. **Check Supabase dashboard** for any error logs
3. **Verify your project status** in Supabase dashboard
4. **Contact Supabase support** if using their cloud service

## Quick Test Commands

```bash
# Test current configuration
node check-supabase-connection.js

# Test with different URL (if needed)
VITE_SUPABASE_URL=https://your-new-url.com node check-supabase-connection.js

# Check environment variables
echo $VITE_SUPABASE_URL
echo $VITE_SUPABASE_ANON_KEY
```

---

**Most likely solution**: Switch to Supabase Cloud for reliable, managed service.