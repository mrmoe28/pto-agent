import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'
import { DeepPermitCrawler } from '../src/lib/deep-crawler'

/**
 * Direct scraping test - bypasses Google Search to test price extraction directly
 * Tests against known Georgia permit office websites
 */

async function testDirectScraping() {
  console.log('🧪 Testing Direct Price Scraping\n')

  // Known permit office websites with fee schedules
  const testUrls = [
    {
      name: 'Fulton County Building Permits',
      url: 'https://www.fultoncountyga.gov/services/building-permits',
      expectedFees: true
    },
    {
      name: 'Gwinnett County Building Department',
      url: 'https://www.gwinnettcounty.com/web/gwinnett/departments/communitydevelopment/building',
      expectedFees: true
    },
    {
      name: 'DeKalb County Building Department',
      url: 'https://www.dekalbcountyga.gov/building-safety',
      expectedFees: true
    }
  ]

  const scraper = new EnhancedWebScraper()
  const deepCrawler = new DeepPermitCrawler()

  for (const testSite of testUrls) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Testing: ${testSite.name}`)
    console.log(`URL: ${testSite.url}`)
    console.log('='.repeat(80))

    try {
      // Test basic scraping
      console.log('\n📋 Step 1: Basic Page Scraping...')
      const basicInfo = await scraper.scrapeDetailedOfficeInfo(testSite.url, {
        allowDynamic: true
      })

      if (basicInfo) {
        console.log(`✓ Office: ${basicInfo.officeName}`)
        console.log(`✓ Department: ${basicInfo.department}`)
        console.log(`✓ Phone: ${basicInfo.phone || 'Not found'}`)
        console.log(`✓ Email: ${basicInfo.email || 'Not found'}`)

        // Check fee structure
        console.log('\n💰 Fee Structure Found:')
        if (basicInfo.feeStructure && Object.keys(basicInfo.feeStructure).length > 0) {
          console.log(JSON.stringify(basicInfo.feeStructure, null, 2))

          const feeTypes = Object.keys(basicInfo.feeStructure).filter(
            key => basicInfo.feeStructure[key as keyof typeof basicInfo.feeStructure]
          )
          console.log(`\n✅ Extracted ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
        } else {
          console.log('❌ No fees found in basic scraping')
        }
      }

      // Test deep crawling
      console.log('\n📊 Step 2: Deep Crawling...')
      const deepData = await deepCrawler.crawlSite(testSite.url, {
        maxDepth: 3,
        maxPages: 10,
        followExternal: false,
        targetPaths: [
          '/fee', '/fees', '/fee-schedule', '/pricing', '/cost', '/charges',
          '/permit', '/building', '/electrical', '/plumbing'
        ],
        extractPDFs: true
      })

      console.log(`✓ Crawled ${deepData.fees.length} fee entries`)
      console.log(`✓ Found ${deepData.timelines.length} timeline entries`)
      console.log(`✓ Found ${deepData.onlineForms.length} online forms`)

      if (deepData.fees.length > 0) {
        console.log('\n💰 Deep Crawl Fees:')
        deepData.fees.forEach((fee, index) => {
          console.log(`\n  ${index + 1}. ${fee.permitType}`)
          console.log(`     Base Fee: $${fee.baseFee || 'N/A'}`)
          if (fee.variableFee) {
            console.log(`     Variable: $${fee.variableFee.amount} per ${fee.variableFee.unit}`)
          }
          console.log(`     Description: ${fee.description}`)
        })
      } else {
        console.log('❌ No fees found in deep crawling')
      }

    } catch (error) {
      console.error(`\n❌ Error scraping ${testSite.name}:`, error)
      if (error instanceof Error) {
        console.error('Message:', error.message)
      }
    }

    // Wait between tests
    await new Promise(resolve => setTimeout(resolve, 3000))
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Direct scraping test completed')
  console.log('='.repeat(80))
}

// Run the test
testDirectScraping()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
