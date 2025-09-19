#!/bin/bash

echo "🔍 Testing Domain Setup for ptoagent.com"
echo "========================================"

echo ""
echo "1. Testing domain resolution..."
echo "   ptoagent.com:"
dig +short ptoagent.com

echo ""
echo "   www.ptoagent.com:"
dig +short www.ptoagent.com

echo ""
echo "2. Testing HTTP response..."
echo "   ptoagent.com:"
curl -I -s https://ptoagent.com | head -1

echo ""
echo "   www.ptoagent.com:"
curl -I -s https://www.ptoagent.com | head -1

echo ""
echo "3. Testing Clerk subdomains..."
echo "   accounts.ptoagent.com:"
dig +short accounts.ptoagent.com

echo ""
echo "   clerk.ptoagent.com:"
dig +short clerk.ptoagent.com

echo ""
echo "✅ Test complete!"
echo ""
echo "Expected results:"
echo "- ptoagent.com should resolve to 76.76.19.61"
echo "- www.ptoagent.com should resolve to 76.76.19.61"
echo "- HTTP responses should be 200 OK"
echo "- Clerk subdomains should resolve to clerk.services"
