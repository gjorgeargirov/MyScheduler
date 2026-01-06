# Debug: Environment Variables Not Working

If `VITE_USE_LOCAL_AUTH = false` is set but the app still uses local auth, the environment variable isn't being read correctly.

## Step 1: Rebuild and Redeploy

Environment variables are baked into the build at build time, so you need to rebuild:

```bash
npm run build
npx wrangler pages deploy dist --project-name=myscheduler
```

## Step 2: Check Browser Console

After deploying, open the browser console (F12) and look for these logs when the page loads:

```
[AUTH CONFIG] VITE_API_BASE: /api
[AUTH CONFIG] VITE_USE_LOCAL_AUTH: false
[AUTH CONFIG] USE_LOCAL_AUTH (computed): false
[AUTH CONFIG] API_BASE: /api
```

**What to check:**
- `VITE_USE_LOCAL_AUTH` should be `"false"` (string)
- `USE_LOCAL_AUTH (computed)` should be `false` (boolean)

**If you see:**
- `VITE_USE_LOCAL_AUTH: undefined` → Variable not set or not deployed
- `USE_LOCAL_AUTH (computed): true` → Variable is being read as truthy

## Step 3: Try Signing Up

When you try to sign up, you should see:

```
[CLIENT] signUp called with USE_LOCAL_AUTH: false
[CLIENT] API_BASE: /api
[CLIENT] Attempting API signup to: /api/auth/signup
[CLIENT] API response status: 200
[CLIENT] API signup successful, user ID: 1
```

**If you see:**
- `[CLIENT] Using LOCAL auth (USE_LOCAL_AUTH is true)` → Variable is still true
- No API call → Still using local auth

## Step 4: Verify Environment Variable Format

In Cloudflare Dashboard:
- Variable name: `VITE_USE_LOCAL_AUTH` (exact, case-sensitive)
- Value: `false` (lowercase, no quotes)
- Environment: **Production** (or Preview if testing preview)

**Common mistakes:**
- ❌ Value: `False` (uppercase)
- ❌ Value: `"false"` (with quotes)
- ❌ Value: `0` (number)
- ✅ Value: `false` (lowercase string)

## Step 5: Clear Browser Cache

After redeploying:
1. **Hard refresh**: `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows)
2. **Or use incognito/private mode**
3. **Or clear browser cache** completely

## Step 6: Check Build Output

The environment variables are embedded at build time. If they're wrong, the build has the wrong values.

**To verify:**
1. After building, check `dist/assets/index-*.js`
2. Search for `VITE_USE_LOCAL_AUTH`
3. You should see it in the code

## Why This Happens

Vite embeds environment variables at **build time**, not runtime. So:
1. Set environment variables in Cloudflare
2. **Rebuild** the app (`npm run build`)
3. **Redeploy** (`npx wrangler pages deploy dist`)

If you only change variables without rebuilding, the old values are still in the build.

## Quick Fix

1. **Verify variable** in Cloudflare Dashboard:
   - `VITE_USE_LOCAL_AUTH` = `false` (exact)
2. **Rebuild**: `npm run build`
3. **Redeploy**: `npx wrangler pages deploy dist --project-name=myscheduler`
4. **Clear browser cache** and test
5. **Check browser console** for the `[AUTH CONFIG]` logs

The console logs will tell you exactly what values are being used!
