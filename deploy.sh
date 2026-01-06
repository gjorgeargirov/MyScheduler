#!/bin/bash
set -e

echo "🚀 Deploying FocusBoard to Cloudflare..."
echo ""

# Step 1: Build the application
echo "📦 Step 1: Building application..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Build failed - dist directory not found"
  exit 1
fi

echo "✅ Build complete!"
echo ""

# Step 2: Verify database schema
echo "🗄️  Step 2: Verifying database schema..."

# Try to use npx wrangler first, fall back to wrangler if available
WRANGLER_CMD="npx wrangler"
if ! command -v wrangler &> /dev/null && ! npx wrangler --version &> /dev/null; then
  echo "❌ Wrangler not found. Please install it:"
  echo "   npm install --save-dev wrangler"
  echo "   Or: npm install -g wrangler"
  exit 1
fi

TABLE_COUNT=$($WRANGLER_CMD d1 execute focusboard-db --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" 2>/dev/null | grep -oP '\d+' | head -1 || echo "0")

if [ "$TABLE_COUNT" -lt "5" ]; then
  echo "⚠️  Tables not found or incomplete. Running schema..."
  $WRANGLER_CMD d1 execute focusboard-db --file=./schema.sql
  echo "✅ Schema applied!"
else
  echo "✅ Database schema verified ($TABLE_COUNT tables found)"
fi
echo ""

# Step 3: Deploy to Cloudflare Pages
echo "🚀 Step 3: Deploying to Cloudflare Pages..."
$WRANGLER_CMD pages deploy dist --project-name=focusboard

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to Cloudflare Dashboard → Workers & Pages → focusboard"
echo "   2. Settings → Environment Variables"
echo "   3. Add: VITE_API_BASE = /api"
echo "   4. Add: VITE_USE_LOCAL_AUTH = false"
echo "   5. Verify D1 binding: Settings → Functions → D1 Database Binding"
echo ""
echo "🌐 Your site should be live at: https://focusboard.pages.dev"
echo ""
