# Environment Variables Setup Guide

This document lists all environment variables needed for the application.

## Client-Side Variables (VITE_*)

These variables are used in the React app and must be prefixed with `VITE_` for Vite to expose them.

### Required for Production (Cloudflare Pages)

| Variable | Description | Example | Required |
|----------|-------------|---------|----------|
| `VITE_API_BASE` | Base URL for API endpoints (Cloudflare Workers) | `https://your-worker.your-subdomain.workers.dev` | ✅ Yes (for production) |
| `VITE_USE_LOCAL_AUTH` | Enable/disable local browser-based auth | `false` (use API) or `true` (local only) | ✅ Yes |
| `VITE_OPENAI_API_KEY` | OpenAI API key for AI scheduling feature | `sk-proj-...` | ⚠️ Optional (if using AI scheduling) |
| `VITE_MICROSOFT_CLIENT_ID` | Microsoft Azure Client ID for Outlook calendar integration | `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx` | ⚠️ Optional (if using Outlook) |

### Local Development (.env file)

Create a `.env` file in the project root:

```env
# API Configuration
VITE_API_BASE=/api
VITE_USE_LOCAL_AUTH=true

# OpenAI (Optional - for AI scheduling)
VITE_OPENAI_API_KEY=sk-proj-your-key-here

# Microsoft Outlook (Optional - for calendar integration)
VITE_MICROSOFT_CLIENT_ID=your-client-id-here
```

## Server-Side Variables (Cloudflare Workers)

These are configured in `wrangler.toml` or Cloudflare Dashboard.

### wrangler.toml Configuration

```toml
name = "focusboard"
compatibility_date = "2026-01-03"

[assets]
directory = "./dist"

# D1 Database Binding
[[d1_databases]]
binding = "DB"
database_name = "my-scheduler-db"
database_id = "your-database-id-here"  # From: wrangler d1 create

# Environment Variables
[vars]
JWT_SECRET = "your-strong-random-secret-here"  # Generate with: openssl rand -hex 32
```

### Required Variables

| Variable | Location | Description | How to Get |
|----------|----------|-------------|------------|
| `JWT_SECRET` | `wrangler.toml` → `[vars]` | Secret key for JWT token signing | Generate: `openssl rand -hex 32` |
| `DB` (binding) | `wrangler.toml` → `[[d1_databases]]` | D1 database binding name | Set to `"DB"` (must match code) |
| `database_id` | `wrangler.toml` → `[[d1_databases]]` | D1 database ID | From: `wrangler d1 create my-scheduler-db` |
| `database_name` | `wrangler.toml` → `[[d1_databases]]` | D1 database name | `"my-scheduler-db"` |

## Setup Instructions

### 1. Local Development Setup

1. **Create `.env` file** in project root:
   ```bash
   touch .env
   ```

2. **Add variables**:
   ```env
   VITE_API_BASE=/api
   VITE_USE_LOCAL_AUTH=true
   VITE_OPENAI_API_KEY=your-key-here  # Optional
   VITE_MICROSOFT_CLIENT_ID=your-id-here  # Optional
   ```

3. **Start dev server**:
   ```bash
   npm run dev
   ```

### 2. Cloudflare Pages Setup

1. **Go to Cloudflare Dashboard**:
   - Workers & Pages → Your Project → Settings → Environment Variables

2. **Add Production Variables**:
   ```
   VITE_API_BASE = https://your-worker.your-subdomain.workers.dev
   VITE_USE_LOCAL_AUTH = false
   VITE_OPENAI_API_KEY = sk-proj-... (if using AI)
   VITE_MICROSOFT_CLIENT_ID = ... (if using Outlook)
   ```

3. **Add Preview Variables** (optional, for preview deployments):
   ```
   VITE_API_BASE = https://your-worker.your-subdomain.workers.dev
   VITE_USE_LOCAL_AUTH = false
   ```

### 3. Cloudflare Workers Setup

1. **Update `wrangler.toml`**:
   ```toml
   [vars]
   JWT_SECRET = "your-generated-secret-here"
   
   [[d1_databases]]
   binding = "DB"
   database_name = "my-scheduler-db"
   database_id = "your-database-id-here"
   ```

2. **Generate JWT Secret**:
   ```bash
   # Option 1: Using OpenSSL
   openssl rand -hex 32
   
   # Option 2: Using Node.js
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

3. **Get Database ID**:
   ```bash
   wrangler d1 create my-scheduler-db
   # Copy the database_id from output
   ```

4. **Deploy Workers**:
   ```bash
   wrangler deploy
   ```

## Variable Descriptions

### VITE_API_BASE
- **Purpose**: Base URL for API endpoints (auth, data sync)
- **Local**: `/api` (uses local Workers via Pages Functions)
- **Production**: `https://your-worker.workers.dev` (your deployed Worker URL)
- **Required**: Yes (for production with D1)

### VITE_USE_LOCAL_AUTH
- **Purpose**: Toggle between local browser storage and API authentication
- **Local**: `true` (uses IndexedDB/localStorage)
- **Production**: `false` (uses D1 database via API)
- **Required**: Yes

### VITE_OPENAI_API_KEY
- **Purpose**: OpenAI API key for AI-powered auto-scheduling
- **Format**: `sk-proj-...`
- **Required**: No (only if using AI scheduling feature)
- **Get from**: https://platform.openai.com/api-keys

### VITE_MICROSOFT_CLIENT_ID
- **Purpose**: Azure AD Client ID for Outlook calendar integration
- **Format**: UUID (`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`)
- **Required**: No (only if using Outlook integration)
- **Get from**: Azure Portal → App Registrations

### JWT_SECRET
- **Purpose**: Secret key for signing and verifying JWT tokens
- **Location**: `wrangler.toml` → `[vars]`
- **Required**: Yes (for production)
- **Security**: Must be a strong, random string (32+ bytes)

### DB (D1 Binding)
- **Purpose**: D1 database binding name in Worker code
- **Location**: `wrangler.toml` → `[[d1_databases]]` → `binding`
- **Value**: Must be `"DB"` (matches code: `env.DB`)
- **Required**: Yes

### database_id
- **Purpose**: Unique identifier for your D1 database
- **Location**: `wrangler.toml` → `[[d1_databases]]` → `database_id`
- **Get from**: Output of `wrangler d1 create my-scheduler-db`
- **Required**: Yes

## Quick Setup Checklist

### For Local Development:
- [ ] Create `.env` file
- [ ] Set `VITE_USE_LOCAL_AUTH=true`
- [ ] (Optional) Add `VITE_OPENAI_API_KEY` if using AI
- [ ] (Optional) Add `VITE_MICROSOFT_CLIENT_ID` if using Outlook

### For Production (Cloudflare):
- [ ] Create D1 database: `wrangler d1 create my-scheduler-db`
- [ ] Update `wrangler.toml` with `database_id`
- [ ] Generate and set `JWT_SECRET` in `wrangler.toml`
- [ ] Deploy Workers: `wrangler deploy`
- [ ] Set `VITE_API_BASE` in Cloudflare Pages (your Worker URL)
- [ ] Set `VITE_USE_LOCAL_AUTH=false` in Cloudflare Pages
- [ ] (Optional) Add `VITE_OPENAI_API_KEY` in Cloudflare Pages
- [ ] (Optional) Add `VITE_MICROSOFT_CLIENT_ID` in Cloudflare Pages

## Security Notes

1. **Never commit `.env` file** - Add to `.gitignore`
2. **JWT_SECRET** - Must be strong and random (32+ bytes)
3. **API Keys** - Keep secure, rotate regularly
4. **Production vs Development** - Use different secrets for each environment

## Troubleshooting

### Variables not working?
- Ensure `VITE_` prefix for client-side variables
- Restart dev server after changing `.env`
- Check Cloudflare Pages environment variables are set correctly
- Verify `wrangler.toml` syntax is correct

### API not connecting?
- Check `VITE_API_BASE` matches your Worker URL
- Verify Worker is deployed: `wrangler deploy`
- Check CORS headers in Worker code
- Verify `VITE_USE_LOCAL_AUTH=false` in production

### Database errors?
- Verify `database_id` in `wrangler.toml` is correct
- Check D1 database exists: `wrangler d1 list`
- Ensure binding name is `"DB"` (uppercase)
- Run schema: `wrangler d1 execute my-scheduler-db --file=./schema.sql`
