# Complete Deployment Guide

This guide walks you through deploying your FocusBoard application to Cloudflare.

## Prerequisites

1. ✅ Cloudflare account
2. ✅ Wrangler CLI installed (see below)
3. ✅ Logged into Cloudflare: `wrangler login`
4. ✅ D1 database created: `focusboard-db` (ID: `2ce24068-cc3a-4afc-8e6d-2e43936ff608`)
5. ✅ `wrangler.toml` configured with database ID and JWT secret

### Installing Wrangler CLI

**Option 1: Install locally (Recommended)**
```bash
npm install --save-dev wrangler
# Then use: npx wrangler or npm run deploy
```

**Option 2: Install globally**
```bash
npm install -g wrangler
# Or if you get permission errors:
sudo npm install -g wrangler
```

**Option 3: Use npx (no installation needed)**
```bash
npx wrangler --version
# Use npx wrangler for all commands
```

## Step 1: Create Database Tables

First, run the schema to create all tables in your D1 database:

**If Wrangler is installed locally:**
```bash
npm run db:schema
# Or: npx wrangler d1 execute focusboard-db --file=./schema.sql
```

**If Wrangler is installed globally:**
```bash
wrangler d1 execute focusboard-db --file=./schema.sql
```

**Verify tables were created:**
```bash
# Local install:
npm run db:execute -- --command="SELECT name FROM sqlite_master WHERE type='table';"

# Global install:
wrangler d1 execute focusboard-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see: `users`, `projects`, `tasks`, `meetings`, `schedule_items`

## Step 2: Build the Application

Build your React app for production:

```bash
npm run build
```

This creates the `dist/` folder with your compiled app.

## Step 3: Deploy to Cloudflare Pages

### Option A: Deploy via Wrangler (Recommended)

**If Wrangler is installed locally:**
```bash
npm run deploy
# Or: npx wrangler pages deploy dist --project-name=focusboard
```

**If Wrangler is installed globally:**
```bash
wrangler pages deploy dist --project-name=focusboard
```

This will:
- Upload your built app to Cloudflare Pages
- Automatically use your `wrangler.toml` configuration
- Bind your D1 database
- Set up the API routes from `functions/` directory

### Option B: Deploy via Git Integration

1. **Push to GitHub/GitLab**:
   ```bash
   git add .
   git commit -m "Deploy to Cloudflare"
   git push origin main
   ```

2. **In Cloudflare Dashboard**:
   - Go to Workers & Pages → Create Application → Pages
   - Connect your Git repository
   - Set build command: `npm run build`
   - Set build output directory: `dist`
   - Click "Save and Deploy"

## Step 4: Configure Environment Variables

In Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Environment Variables:

### Production Variables:
```
VITE_API_BASE = /api
VITE_USE_LOCAL_AUTH = false
```

**Note**: If you're using a separate Worker for API, set `VITE_API_BASE` to your Worker URL:
```
VITE_API_BASE = https://your-worker.your-subdomain.workers.dev
```

### Optional Variables:
```
VITE_OPENAI_API_KEY = sk-proj-... (if using AI scheduling)
VITE_MICROSOFT_CLIENT_ID = ... (if using Outlook integration)
```

## Step 5: Verify D1 Database Binding

In Cloudflare Dashboard → Workers & Pages → Your Project → Settings → Functions:

1. **Check D1 Database Binding**:
   - Should show: `DB` → `focusboard-db`
   - If not, add it manually:
     - Variable name: `DB`
     - D1 Database: `focusboard-db`

## Step 6: Test the Deployment

1. **Visit your Pages URL**: `https://your-project.pages.dev`

2. **Test Authentication**:
   - Try signing up a new user
   - Check if user is created in D1:
     ```bash
     wrangler d1 execute focusboard-db --command="SELECT * FROM users;"
     ```

3. **Test API Endpoints**:
   - Sign up: `POST /api/auth/signup`
   - Sign in: `POST /api/auth/signin`
   - Get tasks: `GET /api/data/tasks` (with Authorization header)

## Step 7: Set Up Custom Domain (Optional)

1. In Cloudflare Dashboard → Your Project → Custom Domains
2. Add your domain
3. Follow DNS setup instructions

## Troubleshooting

### Database Not Found
```bash
# Verify database exists
wrangler d1 list

# Check database ID matches
cat wrangler.toml | grep database_id
```

### API Routes Not Working
- Verify `functions/api/` directory exists
- Check that routes are accessible at `/api/auth/*` and `/api/data/*`
- Verify CORS headers in Worker code

### Environment Variables Not Working
- Ensure variables start with `VITE_` for client-side
- Restart/redeploy after changing variables
- Check browser console for errors

### Build Errors
```bash
# Clear cache and rebuild
rm -rf dist node_modules/.vite
npm run build
```

## Deployment Checklist

- [ ] Database schema executed: `wrangler d1 execute focusboard-db --file=./schema.sql`
- [ ] Tables verified: `wrangler d1 execute focusboard-db --command="SELECT name FROM sqlite_master WHERE type='table';"`
- [ ] App built: `npm run build`
- [ ] Deployed to Cloudflare Pages: `wrangler pages deploy dist`
- [ ] Environment variables set in Cloudflare Dashboard
- [ ] D1 binding verified in Cloudflare Dashboard
- [ ] Authentication tested (signup/signin)
- [ ] Database verified (user created in D1)

## Quick Deploy Script

Create a `deploy.sh` script:

```bash
#!/bin/bash
set -e

echo "🚀 Deploying FocusBoard to Cloudflare..."

echo "📦 Building application..."
npm run build

echo "🗄️  Verifying database schema..."
wrangler d1 execute focusboard-db --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" | grep -q "5" || {
  echo "⚠️  Tables not found. Running schema..."
  wrangler d1 execute focusboard-db --file=./schema.sql
}

echo "🚀 Deploying to Cloudflare Pages..."
wrangler pages deploy dist

echo "✅ Deployment complete!"
echo "🌐 Visit your site at: https://your-project.pages.dev"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Post-Deployment

After deployment:

1. **Test all features**:
   - Sign up / Sign in
   - Create projects
   - Add tasks
   - Schedule meetings
   - Auto-schedule (if OpenAI key is set)

2. **Monitor logs**:
   ```bash
   wrangler pages deployment tail
   ```

3. **Check database**:
   ```bash
   wrangler d1 execute focusboard-db --command="SELECT COUNT(*) FROM users;"
   ```

## Production Checklist

- [ ] JWT_SECRET is strong and secure
- [ ] Environment variables are set correctly
- [ ] Database has proper indexes (already in schema.sql)
- [ ] CORS is configured correctly
- [ ] Error handling is in place
- [ ] Logging is set up (optional)
- [ ] Backup strategy for D1 database (optional)

## Need Help?

- Check Cloudflare Pages logs in Dashboard
- Run `wrangler pages deployment tail` for real-time logs
- Verify database with `wrangler d1 execute` commands
- Check browser console for client-side errors
