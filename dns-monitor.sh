#!/bin/bash

# DNS Propagation Monitor for ptoagent.com
# This script checks when DNS propagation is complete

echo "🔍 Monitoring DNS propagation for ptoagent.com..."
echo "⏰ Started at: $(date)"
echo ""

# Function to check DNS resolution
check_dns() {
    local domain=$1
    local dns_server=$2
    local server_name=$3
    
    echo "Testing with $server_name ($dns_server):"
    result=$(dig @$dns_server $domain +short)
    
    if [ -n "$result" ] && [ "$result" != "NXDOMAIN" ]; then
        echo "✅ $domain resolves to: $result"
        return 0
    else
        echo "❌ $domain not yet resolving"
        return 1
    fi
}

# Check multiple DNS servers
check_all_dns() {
    local domain=$1
    local all_resolved=true
    
    check_dns $domain "8.8.8.8" "Google DNS"
    if [ $? -ne 0 ]; then all_resolved=false; fi
    
    check_dns $domain "1.1.1.1" "Cloudflare DNS"
    if [ $? -ne 0 ]; then all_resolved=false; fi
    
    check_dns $domain "208.67.222.222" "OpenDNS"
    if [ $? -ne 0 ]; then all_resolved=false; fi
    
    if [ "$all_resolved" = true ]; then
        echo ""
        echo "🎉 DNS propagation complete! All servers resolve the domain."
        return 0
    else
        echo ""
        echo "⏳ DNS still propagating... Will check again in 30 seconds."
        return 1
    fi
}

# Main monitoring loop
while true; do
    if check_all_dns "ptoagent.com"; then
        echo ""
        echo "🚀 Ready to add domain to Vercel!"
        echo "Run: vercel domains add ptoagent.com"
        break
    fi
    
    sleep 30
done