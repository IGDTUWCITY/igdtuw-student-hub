#!/bin/bash

# Kill any existing backend
pkill -f "tsx watch" 2>/dev/null
sleep 1

echo "🚀 Starting Backend Server..."
cd /Users/joysajain/Documents/igdtuw-student-hub/backend

# Start backend and save logs
/Users/joysajain/.nvm/versions/node/v22.19.0/bin/npm run dev > /tmp/gemini-test.log 2>&1 &
BACKEND_PID=$!

echo "Backend PID: $BACKEND_PID"
echo "Waiting 3 seconds for server to start..."
sleep 3

echo ""
echo "📡 Making API request to Gemini..."
curl -s -X POST http://localhost:3001/api/sync-opportunities \
  -H "Content-Type: application/json" \
  -d '{"type":"internship"}' > /dev/null

echo "Waiting 3 seconds for response..."
sleep 3

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "📺 BACKEND OUTPUT:"
echo "═══════════════════════════════════════════════════════════"
cat /tmp/gemini-test.log

# Keep backend running for a bit
sleep 2
kill $BACKEND_PID 2>/dev/null
