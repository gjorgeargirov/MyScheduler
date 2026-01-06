# Cloudflare Pages SPA Routing

## Issue
The `_redirects` file format is not supported by Cloudflare Pages in the same way as Netlify.

## Solution

Cloudflare Pages handles Single Page Application (SPA) routing automatically. You don't need a `_redirects` file.

### If you need custom redirects:

**Option 1: Use Cloudflare Dashboard (Recommended)**
1. Go to Cloudflare Dashboard → Pages → Your Project → Custom domains
2. Configure redirects in the dashboard under "Redirects" section
3. Or use "Transform Rules" for more complex routing

**Option 2: Use Functions (Advanced)**
Create `functions/_middleware.ts`:
```typescript
export async function onRequest(context) {
  const url = new URL(context.request.url);
  
  // Handle SPA routing - serve index.html for all routes
  if (!url.pathname.includes('.')) {
    return context.env.ASSETS.fetch(new URL('/index.html', context.request.url));
  }
  
  return context.next();
}
```

**Option 3: Configure in wrangler.toml (for Workers)**
```toml
[[redirects]]
from = "/*"
to = "/index.html"
status = 200
```

## Current Setup

The `_redirects` file has been removed. Cloudflare Pages will automatically handle SPA routing for React Router.

If you encounter routing issues:
1. Check that your React Router is configured correctly
2. Ensure all routes are client-side routes
3. Use Cloudflare Dashboard to add any specific redirects needed
