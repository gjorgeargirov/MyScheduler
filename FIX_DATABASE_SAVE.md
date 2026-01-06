# Fix: Users Not Saving to D1 Database

The issue is that your app is currently using **local storage** (browser storage) instead of the **D1 database**. This is because the environment variable `VITE_USE_LOCAL_AUTH` is not set to `false`.

## The Problem

Looking at your code, `AuthContext.jsx` defaults to local auth:
```javascript
const USE_LOCAL_AUTH = import.meta.env.VITE_USE_LOCAL_AUTH !== 'false';
```

This means if the environment variable isn't set, it uses local storage instead of the API/D1 database.

## Solution: Set Environment Variables

### Step 1: Go to Cloudflare Dashboard

1. Visit: https://dash.cloudflare.com
2. Navigate to: **Workers & Pages** → **myscheduler** → **Settings** → **Environment Variables**

### Step 2: Add/Update Environment Variables

Add these variables for **Production**:

1. **Variable**: `VITE_API_BASE`
   - **Value**: `/api`
   - **Environment**: Production ✅

2. **Variable**: `VITE_USE_LOCAL_AUTH`
   - **Value**: `false` (must be the string "false", not boolean)
   - **Environment**: Production ✅

### Step 3: Create Database Tables (If Not Done)

Run this command to create the database tables:

```bash
npx wrangler d1 execute focusboard-db --file=./schema.sql
```

Verify tables were created:
```bash
npx wrangler d1 execute focusboard-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see: `users`, `projects`, `tasks`, `meetings`, `schedule_items`

### Step 4: Verify D1 Binding

1. Go to **Workers & Pages** → **myscheduler** → **Settings** → **Functions**
2. Scroll to **D1 Database Bindings**
3. Verify it shows:
   - Variable name: `DB`
   - D1 Database: `focusboard-db`

If not present, add it:
- Click **Add binding** → **D1 Database**
- Variable name: `DB` (uppercase)
- D1 Database: `focusboard-db`

### Step 5: Set JWT_SECRET for Functions

1. In the same **Functions** settings page
2. Scroll to **Environment Variables** (Functions section)
3. Add:
   - Variable: `JWT_SECRET`
   - Value: `63d8fe4547bb00293c6edb3dbea651e1207969e25dc4d2141e0db02105ef56e1`

### Step 6: Redeploy

After setting environment variables, you need to trigger a new deployment:

1. Go to **Deployments** tab
2. Click **Retry deployment** on the latest deployment
3. Or make a small change and redeploy

### Step 7: Test Again

1. **Clear browser storage** (important!):
   - Open DevTools (F12)
   - Go to **Storage** tab
   - Click **Clear All** or delete `auth_token` and `auth_user`
   - Or use incognito/private mode

2. **Sign up again** with a new account

3. **Verify in database**:
   ```bash
   npx wrangler d1 execute focusboard-db --command="SELECT id, email, name, created_at FROM users;"
   ```

You should now see your user in the database!

## Troubleshooting

### Still using local storage?

1. **Check environment variables are set correctly**:
   - `VITE_USE_LOCAL_AUTH` must be exactly `false` (string)
   - Not `False`, `FALSE`, or `0`

2. **Check browser console**:
   - Open DevTools → Console
   - Look for API calls to `/api/auth/signup`
   - If you see errors, the API might not be working

3. **Check Network tab**:
   - Open DevTools → Network
   - Try signing up
   - Look for a request to `/api/auth/signup`
   - Check if it returns 200 (success) or an error

### API not working?

1. **Check Functions are deployed**:
   - Verify `functions/api/auth.js` exists in your deployment
   - Check Cloudflare Pages → Functions to see if routes are listed

2. **Check D1 binding**:
   - Ensure `DB` binding is configured
   - Verify database name matches: `focusboard-db`

3. **Check JWT_SECRET**:
   - Must be set in Functions environment variables
   - Not in Pages environment variables (different sections!)

### Database errors?

1. **Verify tables exist**:
   ```bash
   npx wrangler d1 execute focusboard-db --command="SELECT name FROM sqlite_master WHERE type='table';"
   ```

2. **If tables don't exist, create them**:
   ```bash
   npx wrangler d1 execute focusboard-db --file=./schema.sql
   ```

## Quick Checklist

- [ ] `VITE_USE_LOCAL_AUTH = false` set in Cloudflare Pages environment variables
- [ ] `VITE_API_BASE = /api` set in Cloudflare Pages environment variables
- [ ] Database tables created (`users` table exists)
- [ ] D1 binding configured (`DB` → `focusboard-db`)
- [ ] `JWT_SECRET` set in Functions environment variables
- [ ] Redeployed after setting variables
- [ ] Cleared browser storage before testing
- [ ] User appears in database after signup

## After Fixing

Once configured correctly:
- ✅ New signups will save to D1 database
- ✅ Users can sign in from any browser/device
- ✅ Data persists in the cloud, not just locally
