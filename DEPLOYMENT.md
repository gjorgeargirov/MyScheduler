# Deployment Checklist for Cloudflare

## Pre-Deployment Cleanup ✅

### Completed:
- ✅ Removed debug `console.log` statements
- ✅ Removed unused `ChatBotModal.jsx` component
- ✅ `.env` file is in `.gitignore` (API keys are protected)
- ✅ Error handling uses `console.error` appropriately (kept for production debugging)

### Files to Review:
- `src/components/Layout/Header.jsx` - Check if this is used (AppHeader.jsx is the active one)
- `src/components/Calendar/CalendarIntegration.jsx` - Contains TODO comments for Google Calendar (future feature)

## Cloudflare Deployment Steps

### 1. Environment Variables
Set these in Cloudflare Pages Dashboard → Your Project → Settings → Environment Variables:
- `VITE_OPENAI_API_KEY` - Your OpenAI API key

**Important**: Add this as a build environment variable, not a runtime variable.

### 2. Build Configuration in Cloudflare Pages
In Cloudflare Pages Dashboard → Your Project → Settings → Builds & deployments:

**Build command:**
```bash
npm run build
```

**Build output directory:**
```
dist
```

**Root directory:**
```
/
```

**Node version:**
```
18 or 20
```

### 3. Build the Application Locally (for testing)
```bash
npm run build
```

### 4. Deploy to Cloudflare Pages

**Option A: Via Cloudflare Dashboard**
1. Connect your GitHub repository to Cloudflare Pages
2. Cloudflare will automatically build and deploy on push

**Option B: Via Wrangler CLI**
```bash
# Install Wrangler CLI if not already installed
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Deploy
wrangler pages deploy dist
```

### 5. Troubleshooting Build Errors

If you get "internal error" during build:

1. **Check Node version**: Cloudflare Pages uses Node 18 by default. Update in settings if needed.

2. **Check build command**: Ensure it's exactly `npm run build`

3. **Check environment variables**: Make sure `VITE_OPENAI_API_KEY` is set in Cloudflare Pages environment variables (not just locally)

4. **Check for .env file**: The `.env` file should NOT be committed. If build fails due to .env, it will use environment variables from Cloudflare.

5. **Use the build script**: If needed, you can use `cloudflare-pages-build.sh` as a custom build command:
   ```bash
   bash cloudflare-pages-build.sh
   ```

### 4. Update wrangler.toml
- Replace `database_id = "your-database-id-here"` with your actual D1 database ID
- Replace `JWT_SECRET = "your-secret-key-here"` with a strong random secret

### 5. Create D1 Database (if using)
```bash
wrangler d1 create my-scheduler-db
```

## Production Considerations

1. **API Keys**: Ensure `VITE_OPENAI_API_KEY` is set in Cloudflare environment variables
2. **CORS**: If needed, configure CORS headers in Cloudflare Workers
3. **Caching**: Configure appropriate cache headers for static assets
4. **Error Monitoring**: Consider adding error tracking (e.g., Sentry)
5. **Analytics**: Consider adding analytics if needed

## Notes
- The app uses local storage for data persistence (client-side)
- No backend database required for basic functionality
- D1 database is optional (configured in wrangler.toml but not required)
