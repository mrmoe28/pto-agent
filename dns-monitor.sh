#!/bin/bash

# DNS Monitor for ptoagent.com
# Created with Desktop Commander

echo "🔍 DNS Monitor for ptoagent.com"
echo "================================"
echo "Timestamp: $(date)"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to test DNS resolution
test_dns() {
    local domain=$1
    local expected_ip=$2
    local description=$3
    
    echo -n "Testing $description ($domain): "
    
    result=$(dig +short $domain 2>/dev/null)
    
    if [ -z "$result" ]; then
        echo -e "${RED}❌ NOT RESOLVING${NC}"
        return 1
    elif [ "$result" = "$expected_ip" ]; then
        echo -e "${GREEN}✅ OK ($result)${NC}"
        return 0
    else
        echo -e "${YELLOW}⚠️  DIFFERENT IP ($result)${NC}"
        return 1
    fi
}

# Function to test HTTP response
test_http() {
    local url=$1
    local description=$2
    
    echo -n "Testing $description ($url): "
    
    response=$(curl -I -s -o /dev/null -w "%{http_code}" $url 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ OK (HTTP $response)${NC}"
        return 0
    elif [ -z "$response" ]; then
        echo -e "${RED}❌ NO RESPONSE${NC}"
        return 1
    else
        echo -e "${YELLOW}⚠️  HTTP $response${NC}"
        return 1
    fi
}

echo -e "${BLUE}1. DNS Resolution Tests${NC}"
echo "------------------------"
test_dns "ptoagent.com" "76.76.19.61" "Root domain"
test_dns "www.ptoagent.com" "76.76.19.61" "WWW subdomain"
test_dns "accounts.ptoagent.com" "accounts.clerk.services." "Clerk accounts"
test_dns "clerk.ptoagent.com" "frontend-api.clerk.services." "Clerk API"

echo ""
echo -e "${BLUE}2. HTTP Response Tests${NC}"
echo "------------------------"
test_http "https://ptoagent.com" "Root domain HTTPS"
test_http "https://www.ptoagent.com" "WWW subdomain HTTPS"
test_http "http://ptoagent.com" "Root domain HTTP"
test_http "http://www.ptoagent.com" "WWW subdomain HTTP"

echo ""
echo -e "${BLUE}3. Detailed DNS Information${NC}"
echo "------------------------"
echo "Root domain (ptoagent.com):"
dig ptoagent.com +short
echo ""
echo "WWW subdomain (www.ptoagent.com):"
dig www.ptoagent.com +short
echo ""
echo "Clerk accounts subdomain:"
dig accounts.ptoagent.com +short
echo ""
echo "Clerk API subdomain:"
dig clerk.ptoagent.com +short

echo ""
echo -e "${BLUE}4. Network Connectivity Test${NC}"
echo "------------------------"
echo -n "Testing Vercel IP (76.76.19.61): "
if ping -c 1 -W 3000 76.76.19.61 >/dev/null 2>&1; then
    echo -e "${GREEN}✅ REACHABLE${NC}"
else
    echo -e "${RED}❌ NOT REACHABLE${NC}"
fi

echo ""
echo -e "${BLUE}5. Summary${NC}"
echo "------------------------"
echo "If you see ❌ or ⚠️  above, your DNS is not properly configured."
echo "If you see ✅ for all tests, your domain is working correctly!"
echo ""
echo "Next steps if not working:"
echo "1. Check DNS records in Namecheap"
echo "2. Wait 5-60 minutes for propagation"
echo "3. Try switching to Vercel nameservers"
echo "4. Clear browser cache and test again"