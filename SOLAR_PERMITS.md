# Solar/Electrical Permit Information

## Overview
The PTO Agent now specializes in solar panel and electrical permit information, providing detailed instructions, timelines, fees, and requirements for permit submissions.

## Features

### 1. Enhanced Web Scraping
**File**: `src/lib/enhanced-permit-scraper.ts`

The scraper now:
- **Searches specifically for solar/electrical permit pages**
- **Crawls multiple pages** to find comprehensive information
- **Extracts detailed permit instructions** with step-by-step processes
- **Finds processing timelines** (e.g., "5-10 business days")
- **Parses permit fees** including base costs and per-kW charges
- **Lists required documents** from permit websites
- **Discovers application URLs** for online submissions

### 2. Multi-Page Crawling
The scraper doesn't stop at search results. It:
1. Finds the main permit page
2. Follows related links (e.g., "Solar Requirements", "Application Instructions")
3. Extracts information from up to 3 related pages
4. Merges all findings into comprehensive office data

### 3. Solar-Specific Data Extraction

#### Instructions
Extracts step-by-step permit application instructions:
```json
{
  "instructions": {
    "electrical": "For solar installations: 1) Submit site plan showing panel locations 2) Provide electrical diagrams 3) Include product specifications..."
  }
}
```

#### Processing Times
Finds and parses permit timeline information:
```json
{
  "processing_times": {
    "electrical": {
      "min": 5,
      "max": 10,
      "unit": "business days",
      "description": "Plan review typically takes 5-10 business days..."
    }
  }
}
```

#### Permit Fees
Extracts fee structures including base costs and variable charges:
```json
{
  "permit_fees": {
    "electrical": {
      "amount": 150,
      "description": "Base electrical permit fee $150, plus $25 per kW of system capacity",
      "unit": "USD"
    }
  }
}
```

#### Required Documents
Lists all necessary documentation:
```json
{
  "instructions": {
    "requiredDocuments": [
      "Completed electrical permit application",
      "Site plan showing solar panel layout",
      "Single-line electrical diagram",
      "Equipment specifications and certifications",
      "Structural calculations (for roof-mounted systems)"
    ]
  }
}
```

## Georgia Cities with Solar Permit Data

### Currently Available
1. **Lawrenceville, GA** (City)
   - Timeline: 5-10 business days
   - Fee: $150 base + $25/kW
   - Online portal: https://lawrenceville.viewpointcloud.com

2. **Gwinnett County, GA**
   - Timeline: 7-14 business days (Express: 3-5 days)
   - Fee: $200 base + $30/kW
   - Online portal: https://aca-prod.accela.com/GWINNETT

3. **Atlanta, GA** (City)
   - Timeline: 1-10 business days (Expedited available)
   - Fee: $175 flat (up to 25kW)
   - Online portal: https://aca-prod.accela.com/ATLANTA

4. **Fulton County, GA**
   - Timeline: 10-15 business days
   - Fee: $225 base + $35/kW
   - SolSmart certified

5. **Marietta, GA** (City)
   - Timeline: 3-14 business days (Fast-track available)
   - Fee: $165 flat (under 10kW)

## API Response Example

```bash
curl "https://api.ptoagent.com/permit-offices?city=Lawrenceville&state=GA"
```

Response includes:
```json
{
  "offices": [
    {
      "city": "Lawrenceville",
      "department_name": "Development Services Department",
      "electrical_permits": true,
      "instructions": {
        "electrical": "For solar installations: 1) Submit site plan...",
        "requiredDocuments": [
          "Completed electrical permit application",
          "Site plan showing solar panel layout",
          ...
        ]
      },
      "processing_times": {
        "electrical": {
          "min": 5,
          "max": 10,
          "unit": "business days",
          "description": "Plan review typically takes 5-10 business days..."
        }
      },
      "permit_fees": {
        "electrical": {
          "amount": 150,
          "description": "Base electrical permit fee $150, plus $25 per kW",
          "unit": "USD"
        }
      }
    }
  ]
}
```

## How It Works

### Background Job Flow
1. **User searches for location** → If no data exists, scrape job is queued
2. **Cron runs every 5 minutes** → Processes pending jobs
3. **Enhanced scraper searches** → "Lawrenceville GA solar panel electrical permit requirements"
4. **Scraper crawls pages** → Extracts instructions, timelines, fees, documents
5. **Data stored in database** → Available immediately on next search

### Search Query Pattern
The scraper uses optimized search queries:
```
"{city} {county} {state} solar panel electrical permit requirements"
```

This finds:
- Official permit office pages
- Solar-specific requirement pages
- Application instruction pages
- Fee schedules
- Required document lists

## Required Documents (Typical)

Based on scraped data, solar permits typically require:

1. **Completed permit application**
2. **Site plan** - showing solar panel locations
3. **Electrical diagrams** - single-line diagram required
4. **Equipment specifications** - panel and inverter datasheets
5. **Structural calculations** - for roof-mounted systems
6. **Utility interconnection agreement** - from power company
7. **Contractor license and insurance** - if using contractor
8. **HOA approval** - if applicable

## Processing Timelines

| Location | Standard Review | Expedited Option |
|----------|----------------|------------------|
| Lawrenceville | 5-10 business days | Available for fee |
| Gwinnett County | 7-14 business days | 3-5 days (50% surcharge) |
| Atlanta | 7-10 business days | 1-2 days (certified installers) |
| Fulton County | 10-15 business days | Not available |
| Marietta | 7-10 business days | 3-5 days (under 10kW) |

## Permit Fees Structure

**Typical Fee Components:**
- **Base fee**: $150-$225
- **Per kW charge**: $25-$40/kW of DC capacity
- **Inspection fees**: Usually included in base fee
- **Plan review**: Included or separate
- **Expedited review**: 50-100% surcharge

**Example Calculation (10kW system in Lawrenceville):**
```
Base fee: $150
Per kW: $25 × 10kW = $250
Total: $400
```

## Future Enhancements

### Planned Features
1. **More states** - Expand beyond Georgia
2. **Real-time scraping** - Trigger immediate scrapes for new locations
3. **Form pre-fill** - Auto-populate permit applications
4. **Document checklist** - Interactive checklist for required docs
5. **Timeline tracking** - Track your permit through approval process
6. **Fee calculator** - Estimate total costs based on system size
7. **Installer finder** - Connect with certified solar installers

### Data Quality Improvements
1. **Verification system** - Confirm scraped data accuracy
2. **Update frequency** - Automatically refresh data monthly
3. **User contributions** - Allow users to submit corrections
4. **Confidence scoring** - Rate data reliability

## Usage Tips

### For Users
1. **Search by address** - Get location-specific requirements
2. **Check multiple jurisdictions** - City vs County may differ
3. **Verify current info** - Call office to confirm before submission
4. **Use online portals** - Links provided for online applications

### For Developers
1. **Scraper runs automatically** - Cron job every 5 minutes
2. **Manual trigger available** - POST to `/api/jobs/process`
3. **Add more cities** - Use `database/seeds/solar-permit-data.sql` as template
4. **Customize extraction** - Edit `src/lib/enhanced-permit-scraper.ts`

## Environment Variables

```env
# Required for web scraping
GOOGLE_CUSTOM_SEARCH_API_KEY=your_key_here
GOOGLE_CUSTOM_SEARCH_ENGINE_ID=your_id_here

# Optional for auth
CRON_SECRET=your_secret_here
```

## Troubleshooting

### No results for my location?
- Data may not be scraped yet (check back in 5 minutes)
- Location may not have online permit info
- Try searching nearby city or county

### Permit info seems outdated?
- Scraper only captures what's publicly available
- Always verify with permit office before applying
- Report issues via contact form

### Scraper not finding instructions?
- Some jurisdictions don't publish detailed online
- Manual data entry may be needed
- Contact support to prioritize your location

## Contact & Support

For solar permit specific questions:
- Check our knowledge base
- Contact permit office directly (links provided)
- Email support: support@ptoagent.com

---

**Last Updated**: October 2025
**Data Coverage**: Georgia (11 cities/counties)
**Scraper Version**: 2.0 (Solar-focused)
