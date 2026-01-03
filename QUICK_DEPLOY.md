# 🚀 Quick Deploy - Unlimited Free Hosting

## Best Option: Cloudflare Pages (100% FREE, Unlimited)

**Why Cloudflare Pages?**
- ✅ **Unlimited bandwidth** (no limits ever)
- ✅ **Unlimited requests** (no limits ever)
- ✅ **Free SSL certificate**
- ✅ **Global CDN** (super fast worldwide)
- ✅ **No credit card required**
- ✅ **Automatic deployments from GitHub**

## 3 Simple Steps:

### 1. Push to GitHub

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Initial commit"
git branch -M main

# Create a new repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git push -u origin main
```

### 2. Deploy to Cloudflare Pages

1. Go to **[dash.cloudflare.com](https://dash.cloudflare.com)** (sign up free)
2. Click **"Workers & Pages"** in sidebar
3. Click **"Create application"** → **"Pages"** → **"Connect to Git"**
4. Authorize GitHub and select your repository
5. Build settings (auto-detected):
   - Framework: **Vite**
   - Build command: `npm run build`
   - Output directory: `dist`
6. **Add Environment Variables:**
   - `VITE_OPENAI_API_KEY` = your OpenAI key
   - `VITE_MICROSOFT_CLIENT_ID` = your Microsoft ID (optional)
7. Click **"Save and Deploy"**
8. Done! Your app is live at `https://your-project.pages.dev`

### 3. (Optional) Add Custom Domain

1. In Cloudflare Pages → **"Custom domains"**
2. Enter your domain
3. Follow DNS instructions
4. Free SSL automatically!

---

## That's It! 🎉

Your app is now live with **unlimited free hosting**!

**Every time you push to GitHub, it automatically deploys!**

---

## Need Help?

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions and troubleshooting.
