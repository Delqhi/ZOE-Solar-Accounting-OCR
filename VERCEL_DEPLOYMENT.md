# ZOE Solar Accounting - Vercel Deployment Guide

## Prerequisites
- Vercel account with project connected to this repository
- Repository connected to Vercel (GitHub/GitLab)

## Environment Variables Required in Vercel

These secrets must be configured in Vercel Dashboard → Project Settings → Environment Variables:

### Required (Production)
```
VITE_SUPABASE_URL=https://supabase.aura-call.de
VITE_SUPABASE_ANON_KEY=<your-supabase-anon-key>
VITE_GEMINI_API_KEY=<your-google-gemini-api-key>
VITE_SILICONFLOW_API_KEY=<your-siliconflow-api-key>
```

### Optional (if using GitLab integration)
```
VITE_GITLAB_CLIENT_ID=<your-gitlab-oauth-client-id>
VITE_GITLAB_CLIENT_SECRET=<your-gitlab-oauth-client-secret>
VITE_GITLAB_API_TOKEN=<your-gitlab-api-token>
```

### Environment Values
```
VITE_APP_VERSION=1.0.0
NODE_ENV=production
```

## Vercel Configuration

### Project Settings
- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm ci`
- **Development Command**: `npm run dev`

### Build Settings
- **Root Directory**: `/` (or `yangon` if in monorepo)
- **Build Environment Variables**:
  - `VITE_APP_VERSION`: 1.0.0

### Deployment Settings
- **Auto-detected**: Yes (Vercel auto-detects Vite projects)
- **Git Integration**: Connected to repository
- **Production Branch**: `main`

## Post-Deployment Steps

1. **Verify Build**
   ```bash
   # Check deployment logs for errors
   # Should show: ✓ built in ~900ms
   ```

2. **Test Application**
   - Open deployed URL
   - Verify all routes work
   - Check console for errors
   - Test file upload and OCR processing
   - Verify local storage fallback

3. **Monitor Vercel Logs**
   ```bash
   # Vercel dashboard → Project → Deployments → [Deployment] → Logs
   # Look for:
   # - Build errors
   # - Runtime errors
   # - Missing environment variables
   ```

4. **Security Verification**
   - Ensure no console.log in production
   - Verify no source maps exposed
   - Check all API keys are in environment variables only

## Troubleshooting

### Build Fails
- Check `package.json` dependencies are correct
- Run `npm install` locally to verify
- Check TypeScript errors: `npm run typecheck`

### Runtime Errors
- Check environment variables are set
- Verify Supabase configuration
- Check browser console for errors

### Missing Environment Variables
If you see errors about missing variables:
1. Go to Vercel Dashboard → Project Settings → Environment Variables
2. Add all required variables from above
3. Redeploy or run "Redeploy" on latest commit

## Success Criteria

✅ Build completes without errors
✅ All 160+ tests pass
✅ Deploy to Vercel succeeds
✅ Application loads without console errors
✅ Environment variables properly configured
✅ Git history clean (no exposed secrets)

## Emergency Rollback

If deployment fails:
1. Vercel Dashboard → Project → Deployments
2. Click "Rollback" on previous working deployment
3. Or commit revert: `git revert HEAD` and push

## Next Steps

Once deployed successfully:
- Monitor Vercel logs for 24h
- Gather user feedback
- Iterate on features based on real usage
- Add monitoring/alerting if needed
- Consider adding E2E tests with Playwright

---

*This deployment follows 2026 best practices for production-ready applications.*
