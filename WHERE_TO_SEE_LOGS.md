# Where to See Logs

There are **two places** to check logs:

## 1. Browser Console (Client-Side Logs) ⭐ MOST IMPORTANT

These logs show what the **React app** is doing:

1. **Open your app**: https://myscheduler.pages.dev
2. **Open DevTools**: Press `F12` or `Cmd+Option+I` (Mac) or `Ctrl+Shift+I` (Windows)
3. **Go to Console tab**
4. **Reload the page** (Cmd+R or F5)
5. **Look for these logs** when page loads:
   ```
   [AUTH CONFIG] VITE_API_BASE: /api
   [AUTH CONFIG] VITE_USE_LOCAL_AUTH: false
   [AUTH CONFIG] USE_LOCAL_AUTH (computed): false
   [AUTH CONFIG] API_BASE: /api
   ```

6. **Try signing up** and look for:
   ```
   [CLIENT] signUp called with USE_LOCAL_AUTH: false
   [CLIENT] API_BASE: /api
   [CLIENT] Attempting API signup to: /api/auth/signup
   [CLIENT] API response status: 200
   ```

**These logs are in YOUR BROWSER**, not in Cloudflare!

## 2. Cloudflare Logs (Server-Side Logs)

These logs show what the **API/Functions** are doing:

1. **Run in terminal**:
   ```bash
   npx wrangler pages deployment tail
   ```

2. **While that's running**, try signing up in your browser

3. **Look for these logs**:
   ```
   [AUTH] Request: POST /signup
   [AUTH] DB binding exists: true
   [AUTH] JWT_SECRET exists: true
   [AUTH] Signup attempt for: user@example.com
   [AUTH] User inserted successfully! User ID: 1
   POST https://.../api/auth/signup - Ok
   ```

## If You Don't See Any Logs

### Browser Console (Client):
- **Check if console is open**: Make sure DevTools is open and Console tab is selected
- **Check for errors**: Red errors might be hiding other logs
- **Clear console**: Click the clear button (🚫) and try again
- **Check filter**: Make sure "All levels" is selected, not just "Errors"

### Cloudflare Logs (Server):
- **Make sure logs are running**: `npx wrangler pages deployment tail` should be running
- **Try the request**: Sign up while logs are running
- **Check deployment**: Make sure you're watching the correct deployment

## Quick Test

1. **Open browser console** (F12 → Console tab)
2. **Type this** in the console:
   ```javascript
   console.log('Test log - can you see this?');
   ```
3. If you see it, console is working!

4. **Reload the page** and look for `[AUTH CONFIG]` logs
5. If you don't see them, the code might not be deployed yet

## Most Important

**Browser Console** is where you'll see:
- ✅ If environment variables are being read
- ✅ If local auth or API is being used
- ✅ If API calls are being made
- ✅ Any client-side errors

**Cloudflare Logs** show:
- ✅ If API endpoints are being called
- ✅ If database is connected
- ✅ Server-side errors

## After Rebuilding

After you rebuild and redeploy:
1. **Clear browser cache** (Cmd+Shift+R)
2. **Open browser console** (F12)
3. **Reload page** - you should see `[AUTH CONFIG]` logs immediately
4. **Try signing up** - you should see `[CLIENT]` logs

If you still don't see logs, the build might not have the new code yet.
