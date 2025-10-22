import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'

/**
 * Debug script to test fee extraction specifically
 */

async function debugFeeExtraction() {
  console.log('🧪 Debugging Fee Extraction\n')

  const testUrl = 'https://www.savannahga.gov/375/Development-Services-Department'
  console.log(`Testing URL: ${testUrl}`)

  const scraper = new EnhancedWebScraper()

  try {
    console.log('\n📋 Testing Fee Extraction...')
    const result = await scraper.scrapeDetailedOfficeInfo(testUrl, {
      allowDynamic: true
    })

    if (result) {
      console.log('✅ Scraping completed successfully')
      console.log(`Office: ${result.officeName || 'Not found'}`)
      console.log(`Department: ${result.department || 'Not found'}`)
      
      if (result.feeStructure && Object.keys(result.feeStructure).length > 0) {
        console.log('\n💰 Fee Structure Found:')
        console.log(JSON.stringify(result.feeStructure, null, 2))
      } else {
        console.log('\n❌ No fee structure found')
        
        // Let's check what text was extracted
        console.log('\n🔍 Debugging text extraction...')
        
        // Access the private method for debugging
        const scraperAny = scraper as any
        if (scraperAny.extractFeesFromText) {
          // Test with some sample text that should contain fees
          const sampleText = `
            Building Permit Fee: $12.00 per $1,000 of materials and labor
            Minimum Fee: $65.00
            Plan Review Fee: $85.00
            Electrical Permit: $50.00
            Plumbing Permit: $75.00
          `
          
          console.log('\nTesting fee extraction with sample text:')
          const sampleFees = scraperAny.extractFeesFromText(sampleText)
          console.log('Sample fees extracted:', JSON.stringify(sampleFees, null, 2))
        }
      }
    } else {
      console.log('❌ Scraping returned null')
    }

  } catch (error) {
    console.error('❌ Error in fee extraction:', error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  }
}

// Run the debug
debugFeeExtraction()
  .then(() => {
    console.log('\n✅ Debug completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error)
    process.exit(1)
  })
