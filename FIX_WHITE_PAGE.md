# Fix: White Page After Git Push

The white page is likely caused by a JavaScript error. I've fixed the issue where `window` was being accessed at module level.

## What I Fixed

Moved the logging code that uses `window.location` into a `useEffect` hook so it only runs after the component mounts (when `window` is available).

## Step 1: Rebuild and Redeploy

```bash
npm run build
npx wrangler pages deploy dist --project-name=myscheduler
```

## Step 2: Check Browser Console

1. **Open DevTools** (F12) → **Console** tab
2. **Reload the page** (Cmd+R)
3. **Look for errors** - any red error messages?

**If you see an error**, share it and I can fix it.

**If you see the logs**, the app should be working!

## Step 3: Check ErrorBoundary

If the ErrorBoundary caught an error, you'll see a red error message on the page. Check:
- What error message is shown?
- Check browser console for the full error

## Common Causes of White Page

1. **JavaScript error** - Check browser console
2. **Build failed** - Check Cloudflare deployment logs
3. **Module import error** - Check for missing imports
4. **Window access before mount** - Fixed this issue

## Quick Test

After rebuilding, check:
1. **Browser console** - Any red errors?
2. **Network tab** - Are JavaScript files loading? (status 200)
3. **Elements tab** - Is `<div id="root">` empty or does it have content?

## If Still White Page

1. **Check Cloudflare deployment logs**:
   - Go to Cloudflare Dashboard → Deployments
   - Check if build succeeded
   - Look for any build errors

2. **Check browser console**:
   - Share any error messages you see
   - Even if the page is blank, console should show errors

3. **Try local build**:
   ```bash
   npm run build
   npm run preview
   ```
   This tests the build locally before deploying.
