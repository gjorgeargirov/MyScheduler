# Verify Deployment and Fix 405 Error

## The Issue
You're getting a `405 Method Not Allowed` error when trying to sign up. This could mean:
1. Functions aren't deployed
2. Functions are deployed but routing isn't working
3. Deployment is in preview, not production

## Step 1: Check Cloudflare Dashboard

1. Go to **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Navigate to **Workers & Pages** → **myscheduler**
3. Check the **Deployments** tab:
   - You should see recent deployments
   - Note which one is marked as "Production" vs "Preview"
   - The latest deployment should show "Functions bundle" if functions were deployed

## Step 2: Check Functions Are Deployed

1. In the same project, go to **Settings** → **Functions**
2. You should see:
   - `api/auth` function listed
   - `api/data` function listed
   - `_middleware` function listed

If functions aren't listed, they weren't deployed.

## Step 3: Check Logs for Preview Deployment

If your deployment is in preview (not production), try:

```bash
npx wrangler pages deployment tail --project-name=myscheduler --branch=master
```

Or check the deployment ID from the dashboard and use:
```bash
npx wrangler pages deployment tail --project-name=myscheduler --deployment-id=<deployment-id>
```

## Step 4: Verify Function Routing

The function at `functions/api/auth.js` should handle routes at `/api/auth/*`.

In Cloudflare Pages:
- `functions/api/auth.js` → handles `/api/auth/*`
- `functions/_middleware.js` → runs on all requests

## Step 5: Test the Function Directly

1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try signing up
4. Look for the `/api/auth/signup` request
5. Check:
   - **Status**: Currently `405`
   - **Request Method**: Should be `POST`
   - **Request URL**: Should be `https://master.myscheduler.pages.dev/api/auth/signup`
   - **Response**: Click on the request to see the response body

## Step 6: Check Environment Variables

Make sure these are set:

### Pages Environment Variables:
- `VITE_API_BASE` = `/api`
- `VITE_USE_LOCAL_AUTH` = `false`

### Functions Environment Variables:
- `JWT_SECRET` = `63d8fe4547bb00293c6edb3dbea651e1207969e25dc4d2141e0db02105ef56e1`

### D1 Database Binding:
- Variable name: `DB` (uppercase)
- Database: `focusboard-db`

## Step 7: Redeploy if Needed

If functions aren't showing up, redeploy:

```bash
./deploy.sh myscheduler
```

Look for this in the output:
```
✨ Uploading Functions bundle
```

## Common Issues

### Functions Not Deployed
- Make sure `functions/` directory is in project root (not in `dist/`)
- Check deployment output for "Uploading Functions bundle"

### 405 Error
- Usually means the route isn't matching
- Check logs to see if function is being called
- Verify the path extraction in `auth.js` is working

### No Logs
- If you don't see `[AUTH]` logs, the function isn't being called
- This could mean functions aren't deployed or routing is wrong

## Next Steps

1. Check the Cloudflare Dashboard to verify functions are deployed
2. Check which deployment is active (production vs preview)
3. Try the logs command with the correct branch/deployment ID
4. Share what you find so we can fix the routing issue
