#!/bin/bash

# Launch Chrome with Remote Debugging for Playwright Connection
# This allows Playwright to connect to your existing browser session

echo "🚀 Launching Chrome with Remote Debugging..."

# Kill any existing Chrome debug instances
pkill -f "Chrome.*remote-debugging-port=9222" 2>/dev/null

# Get user's Chrome profile path
CHROME_PROFILE="$HOME/Library/Application Support/Google/Chrome"
USER_DATA_DIR="/tmp/chrome-debug-profile"

# Copy user profile to temp location (to avoid conflicts)
echo "📁 Setting up Chrome profile..."
rm -rf "$USER_DATA_DIR" 2>/dev/null
cp -R "$CHROME_PROFILE" "$USER_DATA_DIR" 2>/dev/null || true

# Launch Chrome with debugging
echo "🌐 Starting Chrome..."

# Try different Chrome paths
if [ -d "/Applications/Google Chrome.app" ]; then
    CHROME_PATH="/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
elif [ -d "$HOME/Applications/Google Chrome.app" ]; then
    CHROME_PATH="$HOME/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
else
    echo "❌ Chrome not found. Please install Google Chrome."
    exit 1
fi

# Launch Chrome
"$CHROME_PATH" \
    --remote-debugging-port=9222 \
    --user-data-dir="$USER_DATA_DIR" \
    --no-first-run \
    --no-default-browser-check \
    --disable-default-apps \
    --disable-popup-blocking \
    --disable-translate \
    --disable-background-timer-throttling \
    --disable-backgrounding-occluded-windows \
    --disable-renderer-backgrounding \
    --disable-features=TranslateUI \
    --enable-features=NetworkService,NetworkServiceInProcess &

# Wait for Chrome to start
sleep 3

# Check if Chrome started successfully
if curl -s http://localhost:9222/json/version > /dev/null 2>&1; then
    echo "✅ Chrome started successfully with remote debugging on port 9222"
    echo ""
    echo "📝 Next steps:"
    echo "1. Log into Clerk Dashboard in the browser that just opened"
    echo "2. Navigate to your app's API Keys section"
    echo "3. Run: npm run extract:keys"
    echo ""
    echo "🔗 Chrome DevTools URL: http://localhost:9222"
else
    echo "❌ Failed to start Chrome with remote debugging"
    echo "Check if port 9222 is already in use"
    exit 1
fi