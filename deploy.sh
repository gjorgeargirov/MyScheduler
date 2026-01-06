#!/bin/bash
set -e

# Get project name from command line argument or use default
PROJECT_NAME="${1:-myscheduler}"

echo "🚀 Deploying FocusBoard to Cloudflare..."
echo "   Project name: $PROJECT_NAME"
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

TABLE_COUNT=$($WRANGLER_CMD d1 execute focusboard-db --command="SELECT COUNT(*) as count FROM sqlite_master WHERE type='table';" 2>/dev/null | grep -oE '[0-9]+' | head -1 || echo "0")

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
echo "   Project: $PROJECT_NAME"

# Verify functions directory exists
if [ ! -d "functions" ]; then
  echo "   ❌ ERROR: functions/ directory not found!"
  echo "   Functions must be in the project root for Cloudflare Pages to detect them."
  exit 1
fi

echo "   ✅ Functions directory found"
echo "   📁 Functions:"
ls -1 functions/ 2>/dev/null | sed 's/^/      - /' || echo "      (empty)"
if [ -d "functions/api" ]; then
  ls -1 functions/api/ 2>/dev/null | sed 's/^/      - api\//' || true
fi

# Deploy - wrangler should automatically detect functions/ in the project root
# We deploy from the project root, not from dist, so functions/ is visible
DEPLOY_OUTPUT=$($WRANGLER_CMD pages deploy dist --project-name="$PROJECT_NAME" --commit-dirty=true 2>&1)
DEPLOY_EXIT=$?

if [ $DEPLOY_EXIT -ne 0 ]; then
  if echo "$DEPLOY_OUTPUT" | grep -q "Project not found"; then
    echo "   ⚠️  Project '$PROJECT_NAME' not found."
    echo "   📝 Creating new project..."
    # Create the project (Pages projects need a production branch, but we're deploying directly)
    # For direct deployment, we can skip project creation and let the deploy command handle it
    # Or create with a dummy branch
    CREATE_OUTPUT=$($WRANGLER_CMD pages project create "$PROJECT_NAME" --production-branch=main 2>&1)
    CREATE_EXIT=$?
    if [ $CREATE_EXIT -eq 0 ]; then
      echo "   ✅ Project created successfully!"
      echo "   🚀 Deploying to new project..."
      $WRANGLER_CMD pages deploy dist --project-name="$PROJECT_NAME" --commit-dirty=true
    else
      echo "   ❌ Could not create project automatically."
      echo "   Error: $CREATE_OUTPUT"
      echo ""
      echo "   💡 Please create the project manually in Cloudflare Dashboard:"
      echo "      1. Go to https://dash.cloudflare.com → Workers & Pages"
      echo "      2. Click 'Create application' → 'Pages' → 'Upload assets'"
      echo "      3. Name it: $PROJECT_NAME"
      echo "      4. Upload the 'dist' folder"
      echo "      5. Then run this script again to update it"
      exit 1
    fi
  else
    echo "$DEPLOY_OUTPUT"
    exit 1
  fi
else
  echo "$DEPLOY_OUTPUT"
fi

echo ""
echo "✅ Deployment complete!"
echo ""
echo "📋 Next steps:"
echo "   1. Go to Cloudflare Dashboard → Workers & Pages → myscheduler"
echo "   2. Settings → Environment Variables"
echo "   3. Add: VITE_API_BASE = /api"
echo "   4. Add: VITE_USE_LOCAL_AUTH = false"
echo "   5. Verify D1 binding: Settings → Functions → D1 Database Binding"
echo ""
echo "🌐 Your site should be live at: https://myscheduler.pages.dev"
echo ""
