# Cloudflare Pages Deployment Fix

## Issue
Cloudflare Pages is showing "An internal error occurred" during build.

## Solutions

### Solution 1: Configure Build Settings in Cloudflare Dashboard

1. Go to Cloudflare Dashboard → Pages → Your Project → Settings → Builds & deployments

2. Set these values:
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave empty or use `/`)
   - **Node version**: `18` or `20`

3. **Environment Variables** (Critical!):
   - Go to Settings → Environment Variables
   - Add: `VITE_OPENAI_API_KEY` = `your_actual_api_key`
   - Make sure it's set for **Production** environment
   - This must be set BEFORE building

### Solution 2: Check Node Version

Cloudflare Pages defaults to Node 18. If you need Node 20:
- Add `.nvmrc` file with: `20`
- Or set Node version in Cloudflare Pages settings

### Solution 3: Verify Build Works Locally

```bash
# Test build locally
npm install
npm run build

# If build fails locally, fix those issues first
```

### Solution 4: Use Custom Build Script (if needed)

If the default build fails, you can use the custom build script:

1. In Cloudflare Pages settings, change build command to:
   ```bash
   bash cloudflare-pages-build.sh
   ```

2. Make sure the script is executable (it should be after commit)

### Solution 5: Check for Missing Dependencies

The build might fail if `date-fns` is missing. It's now added to package.json.

If you see import errors, run:
```bash
npm install
```

### Solution 6: SPA Routing

The `_redirects` file has been added to handle client-side routing.
This file should be in the `public/` folder and will be copied to `dist/` during build.

### Solution 7: Clear Build Cache

In Cloudflare Pages:
1. Go to Settings → Builds & deployments
2. Click "Retry deployment" or "Clear build cache"
3. Try deploying again

## Quick Checklist

- [ ] Environment variable `VITE_OPENAI_API_KEY` is set in Cloudflare Pages
- [ ] Build command is: `npm run build`
- [ ] Build output directory is: `dist`
- [ ] Node version is set (18 or 20)
- [ ] All dependencies are in package.json
- [ ] `.env` file is NOT committed (it's in .gitignore)
- [ ] `_redirects` file exists in public/ folder

## Common Errors

### "Module not found: date-fns"
**Fix**: Run `npm install` to install all dependencies

### "VITE_OPENAI_API_KEY is not defined"
**Fix**: Set the environment variable in Cloudflare Pages dashboard

### "Build timeout"
**Fix**: Increase build timeout in Cloudflare Pages settings, or optimize build

### "Permission denied"
**Fix**: Make sure all scripts are executable and files have correct permissions

## After Fixing

1. Commit all changes:
   ```bash
   git add -A
   git commit -m "Fix Cloudflare Pages build configuration"
   git push origin master
   ```

2. Cloudflare will automatically rebuild on push

3. Check the build logs in Cloudflare Pages dashboard

## Still Having Issues?

1. Check the full build log in Cloudflare Pages dashboard
2. Try building locally first: `npm run build`
3. Check if all files are committed
4. Verify environment variables are set correctly
5. Contact Cloudflare support with the build log
