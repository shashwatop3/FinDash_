#!/bin/bash

# Vercel Environment Variables Setup Script
# Run this script to set up all environment variables in Vercel

echo "Setting up Vercel environment variables..."

# Note: You'll need to replace these with your actual NEW credentials after regenerating them
# DO NOT use the exposed credentials from earlier

echo "Setting NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY..."
npx vercel env add NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY production

echo "Setting CLERK_PUBLISHABLE_KEY..."
npx vercel env add CLERK_PUBLISHABLE_KEY production

echo "Setting CLERK_SECRET_KEY..."
npx vercel env add CLERK_SECRET_KEY production

echo "Setting NEXT_PUBLIC_CLERK_SIGN_IN_URL..."
npx vercel env add NEXT_PUBLIC_CLERK_SIGN_IN_URL production

echo "Setting NEXT_PUBLIC_CLERK_SIGN_UP_URL..."
npx vercel env add NEXT_PUBLIC_CLERK_SIGN_UP_URL production

echo "Setting DATABASE_URL..."
npx vercel env add DATABASE_URL production

echo "Setting NEXT_PUBLIC_APP_URL..."
npx vercel env add NEXT_PUBLIC_APP_URL production

echo "Environment variables setup complete!"
echo "Remember to also set these for 'preview' and 'development' environments if needed."
echo "After setting all variables, redeploy your application."
