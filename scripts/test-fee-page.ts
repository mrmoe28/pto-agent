import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'

/**
 * Test the specific Fee Information page to see if it contains fee data
 */

async function testFeePage() {
  console.log('🧪 Testing Fee Information Page\n')

  // Test the specific fee information page that was found
  const feeUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing Fee URL: ${feeUrl}`)
  console.log('='.repeat(80))

  const scraper = new EnhancedWebScraper()

  try {
    console.log('\n📋 Testing Fee Information Page...')
    const result = await scraper.scrapeDetailedOfficeInfo(feeUrl, {
      allowDynamic: true
    })

    if (result) {
      console.log(`✓ Office: ${result.officeName || 'Not found'}`)
      console.log(`✓ Department: ${result.department || 'Not found'}`)
      console.log(`✓ Phone: ${result.phone || 'Not found'}`)
      console.log(`✓ Email: ${result.email || 'Not found'}`)

      // Check fee structure
      console.log('\n💰 Fee Structure:')
      if (result.feeStructure && Object.keys(result.feeStructure).length > 0) {
        console.log(JSON.stringify(result.feeStructure, null, 2))
        const feeTypes = Object.keys(result.feeStructure).filter(key => result.feeStructure[key])
        console.log(`✓ Found ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
      } else {
        console.log('❌ No fees found on fee information page')
      }

      // Check if we can see the raw text content
      console.log('\n🔍 Raw Text Content (first 1000 chars):')
      if (result.fullText) {
        console.log(result.fullText.substring(0, 1000) + '...')
      } else {
        console.log('❌ No full text content available')
      }

    } else {
      console.log('❌ Fee page scraping returned null')
    }

  } catch (error) {
    console.error(`\n❌ Error testing fee page:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Fee page test completed')
  console.log('='.repeat(80))
}

// Run the test
testFeePage()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
