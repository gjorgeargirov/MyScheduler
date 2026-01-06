#!/bin/bash

# Cloudflare Pages Build Script
# This script ensures the build works even if .env is missing

echo "Starting build process..."

# Check if .env exists, if not create a dummy one for build
if [ ! -f .env ]; then
    echo "Warning: .env file not found. Creating temporary .env for build..."
    echo "# Temporary .env for build" > .env
    echo "VITE_OPENAI_API_KEY=" >> .env
fi

# Run the build
npm run build

# Check build result
if [ $? -eq 0 ]; then
    echo "Build successful!"
    exit 0
else
    echo "Build failed!"
    exit 1
fi
