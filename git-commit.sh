#!/bin/bash

# Git Commit Helper Script
# This script helps resolve common git commit issues

echo "=== Git Status Check ==="
git status

echo ""
echo "=== Staging all changes ==="
git add -A

echo ""
echo "=== Checking for changes to commit ==="
if git diff --cached --quiet; then
    echo "No changes to commit. Working tree is clean."
else
    echo "Changes staged. Ready to commit."
    echo ""
    echo "To commit, run:"
    echo "  git commit -m 'Your commit message here'"
    echo ""
    echo "Or use this script with a message:"
    echo "  ./git-commit.sh 'Your commit message'"
    
    if [ -n "$1" ]; then
        echo ""
        echo "=== Committing with message: $1 ==="
        git commit -m "$1"
        echo ""
        echo "=== Commit successful! ==="
        git log --oneline -1
        echo ""
        echo "To push to remote, run:"
        echo "  git push origin master"
    fi
fi

echo ""
echo "=== Current branch status ==="
git status -sb
