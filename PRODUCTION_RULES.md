# Production Rules for PTO Agent

## 🚨 CRITICAL: NO MOCK DATA RULE

**This application is for PRODUCTION USE and must NEVER use mock data.**

### ❌ FORBIDDEN:
- Mock URLs like `example.gov/permits`
- Placeholder search results
- Fake permit office data
- Any hardcoded test data in production code
- Mock API responses

### ✅ REQUIRED:
- **ALL searches must pull REAL data from the web**
- **ALL permit office information must come from actual government websites**
- **ALL URLs must be real, working government websites**
- **ALL contact information must be extracted from real sources**

### Implementation Requirements:

1. **Web Search API**: Must use real search APIs (DuckDuckGo, Google Custom Search, etc.)
2. **Government Websites**: Must search for and return actual `.gov` domains
3. **Data Extraction**: Must extract real contact info, addresses, phone numbers from actual websites
4. **No Fallbacks**: If no real data is found, return empty results rather than mock data

### Code Standards:
- Remove all `example.gov` references
- Remove all mock search results
- Ensure all API endpoints return real data only
- Add validation to reject any mock/placeholder data

### Testing:
- Test with real addresses (like Smyrna, GA)
- Verify all returned URLs are real government websites
- Confirm all contact information is accurate and current

---

**Remember: This is a production application serving real users who need accurate, up-to-date permit office information. Mock data is unacceptable.**
