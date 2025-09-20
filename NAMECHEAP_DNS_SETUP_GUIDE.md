# Namecheap DNS Configuration Guide for ptoagent.com

## 🎯 **Domain**: ptoagent.com
## 🚀 **Target**: Vercel Project (pto-agent-main)

---

## **Step 1: Access Namecheap DNS Management**

1. **Login to Namecheap**:
   - Go to [namecheap.com](https://namecheap.com)
   - Sign in to your account
   - Navigate to **Domain List**
   - Find `ptoagent.com` and click **"Manage"**
   - Click on **"Advanced DNS"** tab

---

## **Step 2: Configure DNS Records**

### **Delete Existing Records**
- Remove any existing A records for `@` and `www`
- Keep any CNAME records for Clerk authentication (if they exist)

### **Add These Records**

#### **A Records (Primary Method)**
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

#### **Alternative: CNAME Method**
```
Type: CNAME Record
Host: www
Value: cname.vercel-dns.com
TTL: Automatic
```

---

## **Step 3: Keep Clerk Records (If They Exist)**

**DO NOT DELETE** these Clerk authentication records:
```
Type: CNAME
Host: accounts
Value: accounts.clerk.services.
TTL: Automatic

Type: CNAME
Host: clerk
Value: frontend-api.clerk.services.
TTL: Automatic

Type: CNAME
Host: clk._domainkey
Value: dkim1.yxs280ntuyah.clerk.services.
TTL: Automatic

Type: CNAME
Host: clk2._domainkey
Value: dkim2.yxs280ntuyah.clerk.services.
TTL: Automatic

Type: CNAME
Host: clkmail
Value: mail.yxs280ntuyah.clerk.services.
TTL: Automatic
```

---

## **Step 4: Wait for DNS Propagation**

- **Wait Time**: 5-60 minutes (usually much faster)
- **Maximum Wait**: 48 hours (rarely needed)

---

## **Step 5: Test DNS Configuration**

After configuring DNS, test with these commands:

```bash
# Test domain resolution
dig ptoagent.com
dig www.ptoagent.com

# Test website access
curl -I https://ptoagent.com
curl -I https://www.ptoagent.com
```

---

## **Step 6: Add Domain to Vercel**

Once DNS is configured, add the domain to Vercel:

```bash
cd /Users/ekodevapps/Downloads/pto-agent-main
vercel domains add ptoagent.com
```

---

## **Expected Results**

After successful configuration:
- ✅ `dig ptoagent.com` returns IP address `76.76.19.61`
- ✅ `curl -I https://ptoagent.com` returns HTTP 200
- ✅ Website loads in browser
- ✅ Clerk authentication works

---

## **Troubleshooting**

### **If Domain Still Not Resolving:**
1. Double-check DNS records in Namecheap
2. Wait longer for DNS propagation
3. Clear browser cache
4. Test with different DNS servers (8.8.8.8, 1.1.1.1)

### **If Vercel Shows 403 Error:**
1. Ensure DNS records are correctly configured
2. Wait for full DNS propagation
3. Try removing and re-adding the domain

---

## **Current Status**

- ✅ Domain purchased: ptoagent.com
- ⏳ DNS configuration: Pending
- ⏳ Vercel domain setup: Pending
- ✅ Vercel project: pto-agent-main (active)

---

## **Next Steps**

1. Configure DNS records in Namecheap (Step 2)
2. Wait for DNS propagation (Step 4)
3. Test DNS resolution (Step 5)
4. Add domain to Vercel (Step 6)
5. Verify website loads correctly

**Your app is currently accessible at: https://pto-agent-main-ekoapps.vercel.app**