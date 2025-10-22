import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'

/**
 * Detailed debugging of fee extraction logic
 */

async function debugFeeExtractionDetailed() {
  console.log('🔍 Detailed Fee Extraction Debug\n')

  // Test with the Savannah fee information page that should have fees
  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing Fee URL: ${testUrl}`)
  console.log('='.repeat(80))

  const scraper = new EnhancedWebScraper()

  try {
    console.log('\n📋 Step 1: Full Page Scraping...')
    const result = await scraper.scrapeDetailedOfficeInfo(testUrl, {
      allowDynamic: true
    })

    if (result) {
      console.log(`✓ Office: ${result.officeName || 'Not found'}`)
      console.log(`✓ Department: ${result.department || 'Not found'}`)
      console.log(`✓ Phone: ${result.phone || 'Not found'}`)
      console.log(`✓ Email: ${result.email || 'Not found'}`)

      // Check fee structure
      console.log('\n💰 Fee Structure Analysis:')
      if (result.feeStructure && Object.keys(result.feeStructure).length > 0) {
        console.log('✅ Fee structure found:')
        console.log(JSON.stringify(result.feeStructure, null, 2))
      } else {
        console.log('❌ No fee structure found')
      }

      // Check raw text content for fee patterns
      console.log('\n🔍 Raw Text Analysis:')
      if (result.fullText) {
        const text = result.fullText.toLowerCase()
        
        // Look for dollar signs
        const dollarMatches = result.fullText.match(/\$[\d,]+\.?\d*/g)
        console.log(`💰 Dollar amounts found: ${dollarMatches ? dollarMatches.length : 0}`)
        if (dollarMatches) {
          console.log('Dollar amounts:', dollarMatches.slice(0, 10))
        }

        // Look for fee-related keywords
        const feeKeywords = ['fee', 'cost', 'charge', 'price', 'permit fee', 'building fee', 'electrical fee']
        const foundKeywords = feeKeywords.filter(keyword => text.includes(keyword))
        console.log(`🔑 Fee keywords found: ${foundKeywords.join(', ')}`)

        // Look for specific fee patterns
        const feePatterns = [
          /\$[\d,]+\.?\d*\s*(?:per|for|each)/gi,
          /fee.*?\$[\d,]+\.?\d*/gi,
          /cost.*?\$[\d,]+\.?\d*/gi,
          /charge.*?\$[\d,]+\.?\d*/gi
        ]
        
        console.log('\n📊 Fee Pattern Analysis:')
        feePatterns.forEach((pattern, index) => {
          const matches = result.fullText.match(pattern)
          console.log(`Pattern ${index + 1}: ${matches ? matches.length : 0} matches`)
          if (matches) {
            console.log(`  Examples: ${matches.slice(0, 3).join(', ')}`)
          }
        })

        // Show first 2000 characters of text for manual inspection
        console.log('\n📄 First 2000 characters of extracted text:')
        console.log(result.fullText.substring(0, 2000))
        console.log('...')
      } else {
        console.log('❌ No full text content available')
      }

    } else {
      console.log('❌ Scraping returned null')
    }

  } catch (error) {
    console.error(`\n❌ Error in detailed debugging:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Detailed debugging completed')
  console.log('='.repeat(80))
}

// Run the debug
debugFeeExtractionDetailed()
  .then(() => {
    console.log('\n✅ Debug completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error)
    process.exit(1)
  })
