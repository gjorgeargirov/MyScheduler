# Cloudflare D1 Database Setup Guide

## Overview
D1 is Cloudflare's SQLite-based database. This guide will help you set up D1 for user authentication and data storage.

## Quick Setup (Automated)

Run the setup script:
```bash
./setup-d1.sh
```

This will:
- Install Wrangler CLI (if needed)
- Login to Cloudflare
- Create the D1 database
- Update wrangler.toml with database ID
- Create database schema
- Generate JWT secret

## Manual Setup

### Step 1: Install Wrangler CLI

```bash
npm install -g wrangler
# or
npm install --save-dev wrangler
```

## Step 2: Login to Cloudflare

```bash
wrangler login
```

This will open your browser to authenticate with Cloudflare.

## Step 3: Create D1 Database

```bash
wrangler d1 create my-scheduler-db
```

This will output something like:
```
✅ Successfully created DB 'my-scheduler-db'!

[[d1_databases]]
binding = "DB"
database_name = "my-scheduler-db"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

**Important**: Copy the `database_id` - you'll need it for the next step.

## Step 4: Update wrangler.toml

Open `wrangler.toml` and replace the placeholder with your actual database ID:

```toml
[[d1_databases]]
binding = "DB"
database_name = "my-scheduler-db"
database_id = "your-actual-database-id-here"  # Replace this!
```

## Step 5: Create Database Schema

Run the migration to create tables:

```bash
wrangler d1 execute my-scheduler-db --file=./schema.sql
```

This will create the following tables:
- **users**: User accounts for authentication
- **projects**: User projects (color-coded categories)
- **tasks**: User tasks with status, priority, duration, etc.
- **meetings**: Calendar meetings/events (including breaks)
- **schedule_items**: Scheduled tasks on the calendar

All tables are linked to users via `user_id` foreign keys, ensuring data isolation between users.

## Step 6: Verify Database Setup

Check that the database was created:

```bash
wrangler d1 list
```

You should see `my-scheduler-db` in the list.

## Step 7: Test Database Connection

Query the database to verify it works:

```bash
wrangler d1 execute my-scheduler-db --command="SELECT name FROM sqlite_master WHERE type='table';"
```

You should see the `users` table listed.

## Step 8: Deploy Worker with D1 Binding

If you're using Cloudflare Workers (not just Pages), deploy with:

```bash
wrangler deploy
```

## Step 9: Configure Environment Variables

In Cloudflare Dashboard → Workers & Pages → Your Project → Settings:

1. **For Cloudflare Pages**:
   - Go to Settings → Environment Variables
   - Add: `VITE_API_BASE` = `https://your-worker.your-subdomain.workers.dev`
   - Add: `VITE_USE_LOCAL_AUTH` = `false`

2. **For Cloudflare Workers**:
   - The D1 binding is automatically available as `env.DB` in your Worker code
   - No additional configuration needed

## Step 10: Update JWT Secret

In `wrangler.toml`, replace the JWT secret:

```toml
[vars]
JWT_SECRET = "your-strong-random-secret-here"  # Generate a strong secret
```

Generate a strong secret:
```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Or using OpenSSL
openssl rand -hex 32
```

## Step 11: Deploy API Worker (if using separate Worker)

If you have a separate Worker for the API:

```bash
# Deploy the auth API worker
wrangler deploy --name my-scheduler-api
```

## Troubleshooting

### Database not found
- Verify database_id in wrangler.toml matches the one from `wrangler d1 create`
- Check you're in the correct Cloudflare account

### Permission errors
- Make sure you're logged in: `wrangler login`
- Verify your account has D1 access (paid plans required for production)

### Migration errors
- Check SQL syntax in schema.sql
- Verify database exists: `wrangler d1 list`

### Binding errors
- Ensure `binding = "DB"` matches the binding name in your Worker code
- Check that `database_id` is correct

## Testing the Setup

1. **Test database connection**:
   ```bash
   wrangler d1 execute my-scheduler-db --command="SELECT COUNT(*) FROM users;"
   ```

2. **Test API endpoint** (if deployed):
   ```bash
   curl https://your-worker.workers.dev/api/auth/signup \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{"email":"test@example.com","password":"test123","name":"Test User"}'
   ```

## Next Steps

After D1 is set up:
1. **Deploy API Workers**: Deploy both `functions/api/auth.js` and `functions/api/data.js` as Cloudflare Workers
2. **Update Environment Variables**: Set `VITE_API_BASE` and `VITE_USE_LOCAL_AUTH=false` in Cloudflare Pages
3. **Test Authentication**: Verify signup/signin flows work
4. **Test Data Sync**: Verify tasks, meetings, projects, and schedule items sync to D1
5. **Update App Code**: The app will automatically use the API when `VITE_USE_LOCAL_AUTH=false`

## Data Storage

The database now stores:
- ✅ **Users**: Authentication data
- ✅ **Projects**: User's project categories
- ✅ **Tasks**: All tasks with full details
- ✅ **Meetings**: Calendar events and breaks
- ✅ **Schedule Items**: Tasks scheduled on the calendar

All data is automatically associated with the authenticated user via `user_id` foreign keys.

## Important Notes

- **D1 is in Beta**: Some features may change
- **Free Tier Limits**: 100,000 reads/day, 1,000 writes/day
- **Pricing**: Check Cloudflare pricing for production usage
- **Backup**: Consider setting up regular backups of your D1 database
- **Local Development**: Use `wrangler d1 execute` for local testing

## Local Development with D1

For local development, you can use:

```bash
# Run local D1 database
wrangler d1 execute my-scheduler-db --local --file=./schema.sql

# Test queries locally
wrangler d1 execute my-scheduler-db --local --command="SELECT * FROM users;"
```
