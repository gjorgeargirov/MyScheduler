# Deployment Guide for FocusBoard

This guide will help you deploy your FocusBoard application to the web.

## Prerequisites

1. **GitHub Account** (recommended for easy deployment)
2. **Cloudflare Account** (FREE with unlimited bandwidth - BEST for free hosting)
3. Your environment variables ready:
   - `VITE_OPENAI_API_KEY` (for AI features)
   - `VITE_MICROSOFT_CLIENT_ID` (for Outlook calendar integration - optional)

## Option 1: Deploy to Cloudflare Pages (BEST - Unlimited Free Hosting) ⭐

**Cloudflare Pages offers:**
- ✅ **Unlimited bandwidth** (completely free)
- ✅ **Unlimited requests** (no limits)
- ✅ **Free SSL certificate**
- ✅ **Global CDN** (fast worldwide)
- ✅ **Automatic deployments** from GitHub
- ✅ **No credit card required**

### Step 1: Push to GitHub

1. Create a new repository on GitHub (if you haven't already)
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy to Cloudflare Pages

1. Go to [dash.cloudflare.com](https://dash.cloudflare.com) and sign up/login (FREE)
2. In the sidebar, click **"Workers & Pages"**
3. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
4. Authorize Cloudflare to access your GitHub account
5. Select your repository
6. Configure build settings:
   - **Framework preset**: Vite
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/` (leave as default)

7. **Add Environment Variables**:
   - Scroll down to "Environment variables"
   - Click "Add variable" for each:
     - Name: `VITE_OPENAI_API_KEY`, Value: your OpenAI API key
     - Name: `VITE_MICROSOFT_CLIENT_ID`, Value: your Microsoft Client ID (optional)
   - Make sure to add them for "Production" environment

8. Click **"Save and Deploy"**
9. Your app will be live at `https://your-project-name.pages.dev` in ~2 minutes!

### Step 3: Custom Domain (Optional - Also FREE)

1. In your Cloudflare Pages project, go to **"Custom domains"**
2. Click **"Set up a custom domain"**
3. Enter your domain name
4. Follow DNS instructions (Cloudflare will guide you)
5. SSL certificate is automatically provisioned (FREE)

---

## Option 2: Deploy to Vercel (Also Free - Generous Limits)

Vercel is the easiest way to deploy Vite apps with automatic deployments from GitHub.

### Step 1: Push to GitHub

1. Create a new repository on GitHub (if you haven't already)
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   git push -u origin main
   ```

### Step 2: Deploy to Vercel

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variables**:
   - Click "Environment Variables"
   - Add:
     - `VITE_OPENAI_API_KEY` = your OpenAI API key
     - `VITE_MICROSOFT_CLIENT_ID` = your Microsoft Client ID (optional)

6. Click "Deploy"
7. Your app will be live at `https://your-project-name.vercel.app`

### Step 3: Custom Domain (Optional)

1. In Vercel dashboard, go to your project → Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions

---

## Option 2: Deploy to Netlify

### Step 1: Push to GitHub (same as above)

### Step 2: Deploy to Netlify

1. Go to [netlify.com](https://netlify.com) and sign up/login
2. Click "Add new site" → "Import an existing project"
3. Connect to GitHub and select your repository
4. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

5. **Add Environment Variables**:
   - Click "Site settings" → "Environment variables"
   - Add:
     - `VITE_OPENAI_API_KEY` = your OpenAI API key
     - `VITE_MICROSOFT_CLIENT_ID` = your Microsoft Client ID (optional)

6. Click "Deploy site"
7. Your app will be live at `https://your-project-name.netlify.app`

---

## Option 3: Deploy to GitHub Pages

### Step 1: Install gh-pages

```bash
npm install --save-dev gh-pages
```

### Step 2: Update package.json

Add these scripts:
```json
"scripts": {
  "predeploy": "npm run build",
  "deploy": "gh-pages -d dist"
}
```

### Step 3: Update vite.config.js

```javascript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  base: '/YOUR_REPO_NAME/', // Replace with your GitHub repo name
})
```

### Step 4: Deploy

```bash
npm run deploy
```

**Note**: GitHub Pages doesn't support environment variables directly. You'll need to use a different approach for secrets (not recommended for production).

---

## Comparison of Free Hosting Options

| Platform | Bandwidth | Requests | Builds | Best For |
|----------|-----------|----------|--------|----------|
| **Cloudflare Pages** | ✅ **Unlimited** | ✅ **Unlimited** | Unlimited | **Best overall - truly unlimited** |
| **GitHub Pages** | ✅ **Unlimited** | ✅ **Unlimited** | Unlimited | Public repos, simple sites |
| **Vercel** | 100GB/month | Unlimited | 100 hours/month | Great DX, auto-deployments |
| **Netlify** | 100GB/month | Unlimited | 300 min/month | Good free tier |

**Recommendation**: Use **Cloudflare Pages** for truly unlimited free hosting! 🚀

---

## Option 5: Deploy to Other Platforms

### Railway
1. Connect GitHub repository
2. Set environment variables
3. Build command: `npm run build`
4. Start command: `npm run preview` (or use a static file server)

### Render
1. Create a new Static Site
2. Connect GitHub repository
3. Build command: `npm run build`
4. Publish directory: `dist`
5. Add environment variables in dashboard

---

## Environment Variables Setup

### Required:
- `VITE_OPENAI_API_KEY` - Your OpenAI API key for AI scheduling features

### Optional:
- `VITE_MICROSOFT_CLIENT_ID` - Microsoft Azure AD Client ID for Outlook calendar integration

**Important**: 
- Never commit `.env` files to Git (already in `.gitignore`)
- Always add environment variables in your hosting platform's dashboard
- Vite requires the `VITE_` prefix for environment variables to be exposed to the client

---

## Post-Deployment Checklist

- [ ] Test the app on the live URL
- [ ] Verify AI scheduling works (check OpenAI API key)
- [ ] Test calendar integration (if using Outlook)
- [ ] Check that localStorage works (data persistence)
- [ ] Test on mobile devices
- [ ] Verify dark mode works
- [ ] Test all major features (tasks, meetings, scheduling)

---

## Troubleshooting

### Build Fails
- Check that all dependencies are in `package.json`
- Verify Node.js version (Vercel/Netlify use Node 18+ by default)
- Check build logs for specific errors

### Environment Variables Not Working
- Ensure variables start with `VITE_` prefix
- Redeploy after adding new environment variables
- Check that variables are set in the correct environment (Production/Preview/Development)

### App Works Locally But Not Deployed
- Check browser console for errors
- Verify all API endpoints are accessible
- Check CORS settings if using external APIs
- Ensure environment variables are set correctly

### Microsoft Calendar Integration Not Working
- Verify `VITE_MICROSOFT_CLIENT_ID` is set
- Check Azure AD app registration redirect URIs include your deployment URL
- Ensure `@azure/msal-browser` is in dependencies

---

## Continuous Deployment

Both Vercel and Netlify automatically deploy when you push to your main branch:
- Push to `main` → Automatic deployment
- Create a pull request → Preview deployment
- Merge PR → Production deployment

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Netlify Docs: https://docs.netlify.com
- Vite Deployment Guide: https://vitejs.dev/guide/static-deploy.html
