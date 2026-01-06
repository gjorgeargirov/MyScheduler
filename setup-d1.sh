#!/bin/bash

# Quick D1 Database Setup Script
# This script helps you set up Cloudflare D1 database for the scheduler app

echo "🚀 Cloudflare D1 Database Setup"
echo "================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install wrangler. Please install manually: npm install -g wrangler"
        exit 1
    fi
    echo "✅ Wrangler installed"
else
    echo "✅ Wrangler CLI found"
fi

echo ""
echo "Step 1: Login to Cloudflare"
echo "---------------------------"
echo "You'll be redirected to your browser to authenticate..."
wrangler login

if [ $? -ne 0 ]; then
    echo "❌ Login failed. Please try again."
    exit 1
fi

echo ""
echo "Step 2: Creating D1 Database"
echo "----------------------------"
echo "Creating database 'my-scheduler-db'..."

# Create database and capture output
DB_OUTPUT=$(wrangler d1 create my-scheduler-db 2>&1)
echo "$DB_OUTPUT"

# Extract database ID from output
DB_ID=$(echo "$DB_OUTPUT" | grep -oP 'database_id = "\K[^"]+' | head -1)

if [ -z "$DB_ID" ]; then
    echo "⚠️  Could not extract database ID automatically."
    echo "Please copy the database_id from the output above and update wrangler.toml manually."
    exit 1
fi

echo ""
echo "✅ Database created!"
echo "Database ID: $DB_ID"

echo ""
echo "Step 3: Updating wrangler.toml"
echo "-------------------------------"

# Update wrangler.toml with the database ID
if [ -f "wrangler.toml" ]; then
    # Use sed to replace the database_id (works on macOS and Linux)
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s/database_id = \"your-database-id-here\"/database_id = \"$DB_ID\"/" wrangler.toml
    else
        sed -i "s/database_id = \"your-database-id-here\"/database_id = \"$DB_ID\"/" wrangler.toml
    fi
    echo "✅ Updated wrangler.toml with database ID"
else
    echo "❌ wrangler.toml not found"
    exit 1
fi

echo ""
echo "Step 4: Creating Database Schema"
echo "---------------------------------"
if [ -f "schema.sql" ]; then
    echo "Running schema.sql..."
    wrangler d1 execute my-scheduler-db --file=./schema.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Database schema created successfully"
    else
        echo "❌ Failed to create schema. Please run manually:"
        echo "   wrangler d1 execute my-scheduler-db --file=./schema.sql"
    fi
else
    echo "⚠️  schema.sql not found. Skipping schema creation."
fi

echo ""
echo "Step 5: Generating JWT Secret"
echo "------------------------------"
# Generate a random secret
if command -v node &> /dev/null; then
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
elif command -v openssl &> /dev/null; then
    JWT_SECRET=$(openssl rand -hex 32)
else
    JWT_SECRET="CHANGE_THIS_TO_A_RANDOM_SECRET_$(date +%s)"
fi

# Update JWT_SECRET in wrangler.toml
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/JWT_SECRET = \"your-secret-key-here\"/JWT_SECRET = \"$JWT_SECRET\"/" wrangler.toml
else
    sed -i "s/JWT_SECRET = \"your-secret-key-here\"/JWT_SECRET = \"$JWT_SECRET\"/" wrangler.toml
fi

echo "✅ Generated and updated JWT_SECRET in wrangler.toml"
echo "   (Keep this secret secure!)"

echo ""
echo "Step 6: Verifying Setup"
echo "-----------------------"
echo "Checking database..."
wrangler d1 list | grep my-scheduler-db

if [ $? -eq 0 ]; then
    echo "✅ Database verified"
else
    echo "⚠️  Database not found in list. Please check manually."
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo ""
echo "Next Steps:"
echo "1. Verify wrangler.toml has the correct database_id and JWT_SECRET"
echo "2. Deploy your Worker (if using separate Worker):"
echo "   wrangler deploy"
echo "3. Set environment variables in Cloudflare Pages dashboard:"
echo "   - VITE_API_BASE=https://your-worker.workers.dev"
echo "   - VITE_USE_LOCAL_AUTH=false"
echo ""
echo "For more details, see D1_DATABASE_SETUP.md"
