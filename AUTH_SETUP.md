# User Authentication Setup Guide

This guide will help you set up user accounts for your FocusBoard application using Cloudflare Workers and D1 database.

## Prerequisites

1. **Cloudflare Account** (free)
2. **Wrangler CLI** installed: `npm install -g wrangler`
3. **Cloudflare Pages** deployment (already set up)

## Step 1: Create D1 Database

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Workers & Pages** → **D1**
3. Click **Create database**
4. Name it: `my-scheduler-db`
5. Copy the **Database ID** (you'll need this)

## Step 2: Initialize Database Schema

1. Run the SQL schema:
   ```bash
   wrangler d1 execute my-scheduler-db --file=./schema.sql
   ```

   Or manually in Cloudflare Dashboard:
   - Go to your D1 database
   - Click **Console**
   - Paste the contents of `schema.sql` and run it

## Step 3: Update wrangler.toml

1. Open `wrangler.toml`
2. Replace `your-database-id-here` with your actual D1 Database ID
3. Replace `your-secret-key-here` with a strong random secret (generate with: `openssl rand -hex 32`)

## Step 4: Deploy Workers

The authentication API is in `functions/api/auth.js`. Cloudflare Pages will automatically deploy it.

## Step 5: Set Environment Variables

In Cloudflare Pages dashboard:
1. Go to your project → **Settings** → **Environment variables**
2. Add:
   - `JWT_SECRET` = your secret key (same as in wrangler.toml)
   - `VITE_API_BASE` = `/api` (or your custom domain API path)

## Step 6: Update App.jsx

The app needs to be wrapped with `AuthProvider`. See the updated `main.jsx` example.

## Testing

1. Deploy your app
2. Click "Sign In" or "Sign Up"
3. Create an account
4. Your data will now be tied to your account!

## Features

✅ **User Sign Up** - Create new accounts  
✅ **User Sign In** - Login with email/password  
✅ **Token-based Auth** - Secure JWT tokens  
✅ **Session Persistence** - Stay logged in  
✅ **Data Isolation** - Each user's data is private  

## Security Notes

- Passwords are hashed using SHA-256 (consider upgrading to bcrypt for production)
- JWT tokens expire after 7 days
- All API calls use HTTPS
- CORS is configured for your domain

## Troubleshooting

**Database not found:**
- Make sure D1 database is created
- Check database ID in wrangler.toml

**Authentication fails:**
- Verify JWT_SECRET is set in environment variables
- Check browser console for errors
- Ensure API routes are accessible

**CORS errors:**
- Update CORS headers in `functions/api/auth.js` to match your domain
