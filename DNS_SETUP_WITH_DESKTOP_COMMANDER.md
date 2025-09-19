# DNS Setup Guide - Using Desktop Commander

## 🎯 **Goal**: Configure ptoagent.com to work with Vercel deployment

## 📋 **Current Status**
- Domain: `ptoagent.com` (purchased from Namecheap)
- Vercel deployment: Ready and configured
- Issue: DNS records not resolving (NXDOMAIN)

## 🔧 **Step-by-Step DNS Configuration**

### **Step 1: Access Namecheap DNS Panel**
1. Go to [Namecheap.com](https://namecheap.com) and log in
2. Navigate to Domain List
3. Click "Manage" next to `ptoagent.com`
4. Click "Advanced DNS" tab

### **Step 2: Configure DNS Records**

#### **DELETE this conflicting record:**
```
Type: CNAME Record
Host: @
Value: cname.vercel-dns.com.
```
**Action**: Delete this record completely

#### **ENSURE these A records exist:**
```
Type: A Record
Host: @
Value: 76.76.19.61
TTL: Automatic

Type: A Record
Host: www
Value: 76.76.19.61
TTL: Automatic
```

#### **KEEP these Clerk records (don't delete):**
```
Type: CNAME Record
Host: accounts
Value: accounts.clerk.services.
TTL: Automatic

Type: CNAME Record
Host: clerk
Value: frontend-api.clerk.services.
TTL: Automatic

Type: CNAME Record
Host: clk._domainkey
Value: dkim1.yxs280ntuyah.clerk.services.
TTL: Automatic

Type: CNAME Record
Host: clk2._domainkey
Value: dkim2.yxs280ntuyah.clerk.services.
TTL: Automatic

Type: CNAME Record
Host: clkmail
Value: mail.yxs280ntuyah.clerk.services.
TTL: Automatic
```

### **Step 3: Alternative - Use Vercel Nameservers**
If manual DNS doesn't work, switch to Vercel nameservers:

1. In Namecheap: Domain List → Manage → Nameservers
2. Change to "Custom DNS"
3. Add:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`

## ⏰ **Wait for Propagation**
- **Minimum**: 5-60 minutes
- **Maximum**: 48 hours
- **Typical**: 15-30 minutes

## 🧪 **Testing Commands**
Use the test script created with Desktop Commander:
```bash
./test-domain-setup.sh
```

## ✅ **Expected Results**
After DNS propagation:
- `dig ptoagent.com` → returns 76.76.19.61
- `dig www.ptoagent.com` → returns 76.76.19.61
- `curl -I https://www.ptoagent.com` → returns HTTP 200
- Website loads in browser
- Clerk authentication works

## 🚨 **Troubleshooting**
If still not working after 1 hour:
1. Double-check DNS records in Namecheap
2. Try switching to Vercel nameservers
3. Clear browser cache
4. Test with different DNS servers (8.8.8.8, 1.1.1.1)