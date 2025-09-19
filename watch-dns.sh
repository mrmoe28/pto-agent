#!/bin/bash

# DNS Watcher - Monitors DNS changes for ptoagent.com
# Created with Desktop Commander

echo "🔍 DNS Watcher for ptoagent.com"
echo "================================"
echo "This will check DNS every 30 seconds until it resolves"
echo "Press Ctrl+C to stop"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

check_count=0

while true; do
    check_count=$((check_count + 1))
    echo -e "${BLUE}Check #$check_count - $(date)${NC}"
    
    # Test root domain
    root_result=$(dig +short ptoagent.com 2>/dev/null)
    if [ -n "$root_result" ]; then
        echo -e "${GREEN}✅ ptoagent.com: $root_result${NC}"
    else
        echo -e "${RED}❌ ptoagent.com: NOT RESOLVING${NC}"
    fi
    
    # Test www subdomain
    www_result=$(dig +short www.ptoagent.com 2>/dev/null)
    if [ -n "$www_result" ]; then
        echo -e "${GREEN}✅ www.ptoagent.com: $www_result${NC}"
    else
        echo -e "${RED}❌ www.ptoagent.com: NOT RESOLVING${NC}"
    fi
    
    # Test HTTP response
    http_response=$(curl -I -s -o /dev/null -w "%{http_code}" https://www.ptoagent.com 2>/dev/null)
    if [ "$http_response" = "200" ]; then
        echo -e "${GREEN}✅ HTTP: $http_response - WEBSITE IS WORKING!${NC}"
        echo ""
        echo -e "${GREEN}🎉 SUCCESS! Your domain is now working!${NC}"
        echo "Visit: https://www.ptoagent.com"
        break
    else
        echo -e "${YELLOW}⚠️  HTTP: $http_response${NC}"
    fi
    
    echo ""
    echo "Waiting 30 seconds for next check..."
    sleep 30
done