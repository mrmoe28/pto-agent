import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'

/**
 * Debug script to test Playwright dynamic scraping
 */

async function debugPlaywright() {
  console.log('🧪 Debugging Playwright Dynamic Scraping\n')

  const testUrl = 'https://www.savannahga.gov/375/Development-Services-Department'
  console.log(`Testing URL: ${testUrl}`)

  const scraper = new EnhancedWebScraper()

  try {
    console.log('\n📋 Testing Dynamic Scraping...')
    const result = await scraper.scrapeDetailedOfficeInfo(testUrl, {
      allowDynamic: true
    })

    if (result) {
      console.log('✅ Dynamic scraping completed successfully')
      console.log(`Office: ${result.officeName || 'Not found'}`)
      console.log(`Department: ${result.department || 'Not found'}`)
      console.log(`Phone: ${result.phone || 'Not found'}`)
      console.log(`Email: ${result.email || 'Not found'}`)
      
      if (result.feeStructure && Object.keys(result.feeStructure).length > 0) {
        console.log('\n💰 Fee Structure Found:')
        console.log(JSON.stringify(result.feeStructure, null, 2))
      } else {
        console.log('\n❌ No fee structure found')
      }
    } else {
      console.log('❌ Dynamic scraping returned null')
    }

  } catch (error) {
    console.error('❌ Error in dynamic scraping:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  }
}

// Run the debug
debugPlaywright()
  .then(() => {
    console.log('\n✅ Debug completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error)
    process.exit(1)
  })
