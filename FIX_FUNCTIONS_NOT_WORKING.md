# Fix: Functions Not Working (405 Errors)

## The Problem
- Functions are being uploaded ("✨ Uploading Functions bundle" appears in deployment)
- But "Settings → Functions" doesn't exist in Cloudflare Dashboard
- `/api/auth/*` routes redirect to `/signin` (React Router catch-all)
- Getting 405 errors with empty responses

## Root Cause
According to Cloudflare documentation, **file upload deployments** (using `wrangler pages deploy`) may not show Functions in the dashboard, but functions should still work. However, if functions aren't being invoked, it's likely a routing issue.

## Solution: Switch to Git-Based Deployment

Cloudflare Pages works best with **Git integration**. This will:
- ✅ Show Functions in the dashboard
- ✅ Enable proper routing
- ✅ Allow better debugging

### Step 1: Connect Your Repository

1. Go to **Cloudflare Dashboard** → **Workers & Pages** → **myscheduler**
2. Go to **Settings** → **Builds & deployments**
3. Click **Connect to Git**
4. Connect your GitHub/GitLab repository
5. Configure build settings:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (or leave empty)

### Step 2: Push Your Code

```bash
git add .
git commit -m "Add functions for API endpoints"
git push origin main
```

Cloudflare will automatically build and deploy.

### Step 3: Set Environment Variables

After Git deployment, go to:
- **Settings** → **Environment Variables** (Pages)
  - `VITE_API_BASE` = `/api`
  - `VITE_USE_LOCAL_AUTH` = `false`

- **Settings** → **Functions** → **Environment Variables**
  - `JWT_SECRET` = `63d8fe4547bb00293c6edb3dbea651e1207969e25dc4d2141e0db02105ef56e1`

- **Settings** → **Functions** → **D1 Database Binding**
  - Variable: `DB`
  - Database: `focusboard-db`

## Alternative: Fix File Upload Deployment

If you want to keep using file upload, try:

### Option 1: Verify Functions Are Actually Deployed

1. Check the deployment details in Cloudflare Dashboard
2. Look for "Functions" in the deployment info
3. Try accessing: `https://master.myscheduler.pages.dev/api/auth/test`
   - If you get JSON → Functions work!
   - If you get redirect → Functions aren't being invoked

### Option 2: Check Function Routing

The function at `functions/api/auth.js` should handle `/api/auth/*`. But if React Router is catching it first, we need to ensure Cloudflare routes API requests to functions before serving static files.

### Option 3: Test with Direct API Call

Use curl to bypass the React app:
```bash
curl https://master.myscheduler.pages.dev/api/auth/test
```

If this works but browser doesn't, it's a routing issue.

## Recommended: Use Git Integration

**Git-based deployment is the recommended approach** because:
- Functions show in dashboard
- Better debugging
- Automatic deployments
- Proper routing

The file upload method works, but has limitations. Git integration will solve the routing issues.

## Next Steps

1. **Try Git integration** (recommended)
2. **Or test with curl** to see if functions work at all
3. **Check deployment logs** for any function-related errors
