# Fix: Database Signup Not Working

## Problem
Users are signing up but not being saved to the D1 database. The `users` table remains empty.

## Root Cause
The app is using **local storage** instead of the **API/database** because:
1. `VITE_USE_LOCAL_AUTH` environment variable is not set in Cloudflare Pages
2. The code defaults to local auth when the variable is not set

## Solution

### Step 1: Set Environment Variables in Cloudflare Pages

1. Go to **Cloudflare Dashboard**: https://dash.cloudflare.com
2. Navigate to **Workers & Pages** → **myscheduler**
3. Go to **Settings** → **Environment Variables**
4. Add these variables:

   **Variable Name:** `VITE_API_BASE`  
   **Value:** `/api`

   **Variable Name:** `VITE_USE_LOCAL_AUTH`  
   **Value:** `false`

5. **Save** the changes

### Step 2: Set JWT_SECRET in Functions Environment Variables

1. In the same project, go to **Settings** → **Functions** → **Environment Variables**
2. Add:

   **Variable Name:** `JWT_SECRET`  
   **Value:** `63d8fe4547bb00293c6edb3dbea651e1207969e25dc4d2141e0db02105ef56e1`

3. **Save** the changes

### Step 3: Verify D1 Database Binding

1. Go to **Settings** → **Functions** → **D1 Database Binding**
2. Make sure there's a binding named **`DB`** (uppercase) pointing to **`focusboard-db`**
3. If it's missing or named differently, add it:
   - **Variable name:** `DB` (must be uppercase)
   - **Database:** `focusboard-db`

### Step 4: Rebuild and Redeploy

After setting the environment variables, you need to rebuild because Vite embeds environment variables at build time:

```bash
./deploy.sh myscheduler
```

### Step 5: Test Signup

1. Visit: https://myscheduler.pages.dev
2. Open browser console (F12 → Console tab)
3. Look for these logs when the page loads:
   ```
   🔧 AUTHENTICATION CONFIGURATION
   USE_LOCAL_AUTH (computed): false
   Using: 🟢 API/DATABASE
   ```
4. Try signing up
5. Check the logs - you should see:
   ```
   🌐 [CLIENT] Attempting API signup
   📡 [CLIENT] API Response: status 200
   ```
6. Check the database in Cloudflare Dashboard → D1 → focusboard-db → users table

## Verify It's Working

### Browser Console Logs
When you sign up, you should see:
- `🌐 [CLIENT] Attempting API signup` (not `🔴 LOCAL STORAGE`)
- `📡 [CLIENT] API Response: status 200`
- `✅ [CLIENT] Signup successful`

### Cloudflare Logs
Run this in terminal:
```bash
npx wrangler pages deployment tail
```

Then sign up and look for:
```
[AUTH] Request: POST /signup
[AUTH] DB binding exists: true
[AUTH] JWT_SECRET exists: true
[AUTH] User inserted successfully! User ID: 1
```

### Database
Go to Cloudflare Dashboard → D1 → focusboard-db → Studio → users table
You should see the new user record.

## Important Notes

- **Environment variables must be set BEFORE rebuilding** (Vite embeds them at build time)
- The variable name must be **exactly** `VITE_USE_LOCAL_AUTH` (with `VITE_` prefix)
- The value must be the **string** `false` (not boolean false)
- The D1 binding must be named **`DB`** (uppercase) to match the code

## If It Still Doesn't Work

1. **Check browser console** for errors
2. **Check Cloudflare logs** (`npx wrangler pages deployment tail`)
3. **Verify environment variables** are set correctly (they're case-sensitive)
4. **Clear browser cache** and try again
5. **Check network tab** in browser DevTools to see if API calls are being made
