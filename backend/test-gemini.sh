#!/bin/bash

echo "🧪 Testing IGDTUW Backend - Gemini Integration"
echo "================================================"
echo ""
echo "📍 Testing endpoint: POST /api/sync-opportunities"
echo "⏳ This may take 10-30 seconds as Gemini fetches opportunities..."
echo ""

# Make the API call
response=$(curl -s -X POST http://localhost:3001/api/sync-opportunities \
  -H "Content-Type: application/json" \
  -d '{"type":"internship"}')

# Pretty print the JSON response
echo "$response" | python3 -m json.tool

echo ""
echo "✅ Test complete!"
