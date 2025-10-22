import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { EnhancedWebScraper } from '../src/lib/enhanced-web-scraper'
import { DeepPermitCrawler } from '../src/lib/deep-crawler'

/**
 * Test scraper extraction without database dependencies
 */

async function testScraperOnly() {
  console.log('🧪 Testing Scraper Data Extraction (No Database)\n')

  // Test with a known working government website
  const testUrl = 'https://www.savannahga.gov/375/Development-Services-Department'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  const scraper = new EnhancedWebScraper()
  const deepCrawler = new DeepPermitCrawler()

  try {
    // Test enhanced web scraper
    console.log('\n📋 Step 1: Enhanced Web Scraper...')
    const basicInfo = await scraper.scrapeDetailedOfficeInfo(testUrl, {
      allowDynamic: true
    })

    if (basicInfo) {
      console.log(`✓ Office: ${basicInfo.officeName || 'Not found'}`)
      console.log(`✓ Department: ${basicInfo.department || 'Not found'}`)
      console.log(`✓ Phone: ${basicInfo.phone || 'Not found'}`)
      console.log(`✓ Email: ${basicInfo.email || 'Not found'}`)

      // Check fee structure
      console.log('\n💰 Fee Structure:')
      if (basicInfo.feeStructure && Object.keys(basicInfo.feeStructure).length > 0) {
        console.log(JSON.stringify(basicInfo.feeStructure, null, 2))
        const feeTypes = Object.keys(basicInfo.feeStructure).filter(key => basicInfo.feeStructure[key])
        console.log(`✓ Found ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
      } else {
        console.log('❌ No fees found in enhanced scraper')
      }

      // Check instructions
      console.log('\n📝 Instructions:')
      if (basicInfo.instructions && Object.keys(basicInfo.instructions).length > 0) {
        console.log(JSON.stringify(basicInfo.instructions, null, 2))
        const instructionTypes = Object.keys(basicInfo.instructions).filter(key => basicInfo.instructions[key])
        console.log(`✓ Found ${instructionTypes.length} instruction type(s): ${instructionTypes.join(', ')}`)
      } else {
        console.log('❌ No instructions found in enhanced scraper')
      }

      // Check forms
      console.log('\n📄 Forms:')
      if (basicInfo.forms && Object.keys(basicInfo.forms).length > 0) {
        console.log(JSON.stringify(basicInfo.forms, null, 2))
        const formTypes = Object.keys(basicInfo.forms).filter(key => basicInfo.forms[key])
        console.log(`✓ Found ${formTypes.length} form type(s): ${formTypes.join(', ')}`)
      } else {
        console.log('❌ No forms found in enhanced scraper')
      }
    } else {
      console.log('❌ Enhanced scraper returned null')
    }

    // Test deep crawler
    console.log('\n📊 Step 2: Deep Crawler...')
    const deepData = await deepCrawler.crawlSite(testUrl, {
      maxDepth: 2,
      maxPages: 5,
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

    // Summary
    console.log('\n' + '='.repeat(80))
    console.log('📊 EXTRACTION SUMMARY')
    console.log('='.repeat(80))
    
    const hasBasicData = basicInfo && (basicInfo.officeName || basicInfo.department || basicInfo.phone)
    const hasFees = basicInfo?.feeStructure && Object.keys(basicInfo.feeStructure).length > 0
    const hasInstructions = basicInfo?.instructions && Object.keys(basicInfo.instructions).length > 0
    const hasDeepFees = deepData.fees.length > 0
    
    console.log(`Basic Data Extraction: ${hasBasicData ? '✅ Working' : '❌ Failed'}`)
    console.log(`Fee Extraction (Enhanced): ${hasFees ? '✅ Working' : '❌ Failed'}`)
    console.log(`Instructions Extraction: ${hasInstructions ? '✅ Working' : '❌ Failed'}`)
    console.log(`Fee Extraction (Deep Crawl): ${hasDeepFees ? '✅ Working' : '❌ Failed'}`)
    
    if (!hasFees && !hasDeepFees) {
      console.log('\n⚠️  ISSUE: No fees are being extracted from government websites')
      console.log('   This explains why instructions and fees are not showing in the app')
    }

  } catch (error) {
    console.error(`\n❌ Error in scraper test:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
      console.error('Stack:', error.stack)
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Scraper test completed')
  console.log('='.repeat(80))
}

// Run the test
testScraperOnly()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
