#!/bin/zsh

# Script to restart the Next.js application
cd /Users/split/Desktop/projects/skepsis/packages/skepsis-web

# Kill any running Next.js processes
echo "Finding and stopping any running Next.js processes..."
pkill -f "node.*/next"

# Clean Next.js cache
echo "Cleaning Next.js cache..."
rm -rf .next

# Install dependencies (if needed)
echo "Checking for node_modules..."
if [ ! -d "node_modules" ] || [ "$1" = "--install" ]; then
  echo "Installing or updating dependencies..."
  npm install
fi

# Start the application
echo "Starting Next.js development server..."
npm run dev
