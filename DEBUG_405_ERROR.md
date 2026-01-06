# Debug 405 Method Not Allowed Error

## Problem
Getting `405 Method Not Allowed` when trying to sign up at `/api/auth/signup`

## What to Check

### 1. Check Cloudflare Logs
Run this command to see real-time logs:
```bash
npx wrangler pages deployment tail --project-name=myscheduler
```

Then try signing up and look for:
- `[AUTH] Full URL: ...`
- `[AUTH] Pathname: ...`
- `[AUTH] Extracted path: ...`
- `[AUTH] No handler found for path: ...`

### 2. Verify Function File Structure
The function should be at: `functions/api/auth.js`
This handles routes at: `/api/auth/*`

### 3. Check Browser Network Tab
1. Open DevTools (F12)
2. Go to Network tab
3. Try signing up
4. Click on the `/api/auth/signup` request
5. Check:
   - **Request Method**: Should be `POST`
   - **Request URL**: Should be `https://master.myscheduler.pages.dev/api/auth/signup`
   - **Status Code**: Currently showing `405`
   - **Response Headers**: Check what's being returned

### 4. Verify Environment Variables
Make sure these are set in Cloudflare Dashboard:
- **Pages Environment Variables**: `VITE_API_BASE = /api`
- **Functions Environment Variables**: `JWT_SECRET = ...`
- **D1 Binding**: `DB` → `focusboard-db`

### 5. Test the Route Directly
Try calling the API directly with curl:
```bash
curl -X POST https://master.myscheduler.pages.dev/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
```

## Possible Causes

1. **Function not deployed**: The `functions/api/auth.js` file might not be in the deployment
2. **Path routing issue**: Cloudflare Pages might not be routing `/api/auth/*` correctly
3. **Method mismatch**: The request might be using a different HTTP method
4. **CORS preflight**: The OPTIONS request might be failing

## Next Steps

After checking the logs, we'll know:
- If the function is being called at all
- What path is being extracted
- What method is being received
- Why it's returning 405 instead of handling the request
