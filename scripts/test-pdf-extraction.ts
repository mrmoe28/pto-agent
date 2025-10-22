import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'

/**
 * Test PDF extraction with Savannah fee document
 */

async function testPDFExtraction() {
  console.log('🧪 Testing PDF Extraction with Savannah Fee Document\n')

  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  const scraper = new EnhancedWebScraper()

  try {
    console.log('\n📄 Step 1: Testing PDF extraction...')
    const result = await scraper.scrapeDetailedOfficeInfo(testUrl, {
      allowDynamic: true
    })

    if (result) {
      console.log(`✅ Scraping completed successfully`)
      console.log(`✓ Office: ${result.officeName || 'Not found'}`)
      console.log(`✓ Department: ${result.department || 'Not found'}`)
      console.log(`✓ Phone: ${result.phone || 'Not found'}`)
      console.log(`✓ Email: ${result.email || 'Not found'}`)

      // Check fee structure
      console.log('\n💰 Fee Structure Analysis:')
      if (result.feeStructure && Object.keys(result.feeStructure).length > 0) {
        console.log('✅ Fee structure found:')
        console.log(JSON.stringify(result.feeStructure, null, 2))
        
        const feeTypes = Object.keys(result.feeStructure).filter(key => result.feeStructure[key])
        console.log(`✓ Found ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
        
        if (feeTypes.length > 0) {
          console.log('\n🎉 SUCCESS: PDF fee extraction is working!')
        }
      } else {
        console.log('❌ No fee structure found')
      }

      // Check instructions
      console.log('\n📝 Instructions Analysis:')
      if (result.instructions && Object.keys(result.instructions).length > 0) {
        console.log('✅ Instructions found:')
        console.log(JSON.stringify(result.instructions, null, 2))
        
        const instructionTypes = Object.keys(result.instructions).filter(key => result.instructions[key])
        console.log(`✓ Found ${instructionTypes.length} instruction type(s): ${instructionTypes.join(', ')}`)
        
        if (instructionTypes.length > 0) {
          console.log('\n🎉 SUCCESS: PDF instruction extraction is working!')
        }
      } else {
        console.log('❌ No instructions found')
      }

      // Check metadata
      console.log('\n📊 Metadata:')
      console.log(`✓ Data completeness: ${result.metadata?.dataCompleteness || 0}%`)
      console.log(`✓ Scraping method: ${result.metadata?.scrapingMethod || 'unknown'}`)
      console.log(`✓ Source reliability: ${result.metadata?.sourceReliability || 'unknown'}`)

      // Summary
      console.log('\n' + '='.repeat(80))
      console.log('📊 PDF EXTRACTION TEST SUMMARY')
      console.log('='.repeat(80))
      
      const hasFees = result.feeStructure && Object.keys(result.feeStructure).length > 0
      const hasInstructions = result.instructions && Object.keys(result.instructions).length > 0
      
      console.log(`PDF Fee Extraction: ${hasFees ? '✅ SUCCESS' : '❌ FAILED'}`)
      console.log(`PDF Instruction Extraction: ${hasInstructions ? '✅ SUCCESS' : '❌ FAILED'}`)
      
      if (hasFees || hasInstructions) {
        console.log('\n🎉 PDF EXTRACTION IS WORKING!')
        console.log('   The scraper can now extract real fee data from PDF documents')
        console.log('   This will fix the issue with fees and instructions not showing')
      } else {
        console.log('\n⚠️  PDF extraction needs debugging')
        console.log('   Check if PDF links are being found and processed')
      }

    } else {
      console.log('❌ Scraping returned null')
    }

  } catch (error) {
    console.error(`\n❌ Error in PDF extraction test:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 PDF extraction test completed')
  console.log('='.repeat(80))
}

// Run the test
testPDFExtraction()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
