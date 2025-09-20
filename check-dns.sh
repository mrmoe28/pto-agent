#!/bin/bash

# Quick DNS check for ptoagent.com
echo "🔍 Checking DNS propagation for ptoagent.com..."
echo ""

# Check with different DNS servers
echo "Testing with Google DNS (8.8.8.8):"
dig @8.8.8.8 ptoagent.com +short

echo ""
echo "Testing with Cloudflare DNS (1.1.1.1):"
dig @1.1.1.1 ptoagent.com +short

echo ""
echo "Testing with local DNS:"
dig ptoagent.com +short

echo ""
echo "If you see IP addresses above, DNS propagation is complete!"
echo "If you see empty results, DNS is still propagating..."