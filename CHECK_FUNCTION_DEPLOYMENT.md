# Check Function Deployment

## The 405 Error

A `405 Method Not Allowed` error when calling `/api/auth/signup` suggests the function might not be deployed or the routing isn't working.

## Verify Functions Are Deployed

1. **Check deployment output**: When you run `./deploy.sh`, you should see:
   ```
   ✨ Uploading Functions bundle
   ```

2. **Check Cloudflare Dashboard**:
   - Go to **Workers & Pages** → **myscheduler**
   - Go to **Settings** → **Functions**
   - You should see the functions listed there

3. **Check logs**: Run:
   ```bash
   npx wrangler pages deployment tail --project-name=myscheduler
   ```
   Then try signing up. You should see `[AUTH]` logs if the function is being called.

## If Functions Aren't Deployed

The `functions/` directory should be automatically included when deploying with `wrangler pages deploy dist`. But if it's not:

1. Make sure `functions/` is in the project root (not in `dist/`)
2. The structure should be:
   ```
   MyScheduler/
   ├── functions/
   │   ├── _middleware.js
   │   └── api/
   │       ├── auth.js
   │       └── data.js
   ├── dist/
   └── ...
   ```

3. When deploying, wrangler should automatically detect and include `functions/`

## Test the Function

Try accessing the function directly to see if it's deployed:
- The function at `functions/api/auth.js` should handle `/api/auth/*` routes
- Try: `https://master.myscheduler.pages.dev/api/auth/signup` (POST)

## Next Steps

1. Check the deployment logs to see if functions were uploaded
2. Check Cloudflare Dashboard to verify functions are listed
3. Check the real-time logs when trying to sign up
4. If functions aren't there, we may need to manually verify the deployment process
