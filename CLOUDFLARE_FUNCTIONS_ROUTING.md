# Cloudflare Pages Functions Routing Issue

## The Problem
When visiting `/api/auth/test`, you're being redirected to `/signin` by the React Router. This means:
- **The Cloudflare Function is NOT being invoked**
- The React app is handling the route instead
- Functions should intercept `/api/*` routes BEFORE static files

## Why This Happens
In Cloudflare Pages:
1. Functions should intercept matching routes FIRST
2. If no function matches, it serves static files
3. Your React app loads `index.html` for all routes (SPA routing)
4. React Router's catch-all route (`path="*"`) redirects unknown routes to `/signin`

## Solution: Verify Function Deployment

### Step 1: Check Cloudflare Dashboard
1. Go to **Workers & Pages** → **myscheduler**
2. Go to **Settings** → **Functions**
3. **Do you see `api/auth` listed?**
   - ✅ **YES**: Function is deployed, but routing might be wrong
   - ❌ **NO**: Function wasn't deployed - this is the problem!

### Step 2: Check Deployment Output
When you ran `./deploy.sh`, did you see:
```
✨ Uploading Functions bundle
```

If you didn't see this, functions weren't deployed.

### Step 3: Verify Function File Structure
The function should be at:
```
MyScheduler/
├── functions/
│   ├── _middleware.js
│   └── api/
│       ├── auth.js    ← This should handle /api/auth/*
│       └── data.js
└── dist/
```

### Step 4: Test Function Directly
Try accessing the function with a direct API call (not through browser):
```bash
curl -X GET https://master.myscheduler.pages.dev/api/auth/test
```

If this also redirects or returns 405, the function isn't working.

## If Functions Aren't Deployed

### Option 1: Manual Verification
1. Check if `functions/` directory exists in project root
2. Verify files are there: `ls -la functions/api/`
3. Redeploy: `./deploy.sh myscheduler`
4. Watch for "Uploading Functions bundle" message

### Option 2: Check Wrangler Configuration
The `wrangler.toml` might need configuration. Check if it has:
```toml
pages_build_output_dir = "./dist"
```

### Option 3: Deploy Functions Separately
If automatic deployment isn't working, you might need to:
1. Use Cloudflare Dashboard to upload functions manually
2. Or check if there's a build configuration issue

## Next Steps

1. **Check the Dashboard** - See if functions are listed
2. **Check deployment logs** - See if "Functions bundle" was uploaded
3. **Test with curl** - See if function responds to direct API calls
4. **Share results** - Let me know what you find

The key is: **If functions aren't in the Dashboard, they weren't deployed, and that's why you're getting redirected.**
