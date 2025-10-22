import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { scrapeSolarPermitData } from '../src/lib/enhanced-permit-scraper'

/**
 * Test script to debug permit price extraction
 * Tests against real Georgia county permit offices
 */

async function testScraper() {
  console.log('🧪 Testing Permit Price Scraper\n')

  // Test locations with known fee schedules
  const testLocations = [
    {
      name: 'Fulton County, GA',
      city: 'Atlanta',
      county: 'Fulton',
      state: 'GA',
      latitude: 33.7490,
      longitude: -84.3880
    },
    {
      name: 'Gwinnett County, GA',
      city: 'Lawrenceville',
      county: 'Gwinnett',
      state: 'GA',
      latitude: 33.9562,
      longitude: -83.9880
    }
  ]

  for (const location of testLocations) {
    console.log(`\n${'='.repeat(80)}`)
    console.log(`Testing: ${location.name}`)
    console.log('='.repeat(80))

    try {
      const results = await scrapeSolarPermitData({
        city: location.city,
        county: location.county,
        state: location.state,
        latitude: location.latitude,
        longitude: location.longitude
      })

      console.log(`\n✅ Found ${results?.length || 0} permit office(s)`)

      if (results && results.length > 0) {
        results.forEach((office, index) => {
          console.log(`\n--- Office ${index + 1} ---`)
          console.log(`Department: ${office.departmentName}`)
          console.log(`Website: ${office.website}`)
          console.log(`\n📋 Permit Fees:`)

          if (office.permitFees) {
            const fees = office.permitFees as Record<string, any>
            console.log(JSON.stringify(fees, null, 2))

            // Count how many fee types were found
            const feeTypes = Object.keys(fees).filter(key => fees[key])
            console.log(`\n✓ Extracted ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
          } else {
            console.log('❌ No permit fees extracted')
          }

          console.log(`\n📝 Instructions:`)
          if (office.instructions) {
            const instructions = office.instructions as Record<string, any>
            console.log(JSON.stringify(instructions, null, 2))
          } else {
            console.log('❌ No instructions extracted')
          }

          console.log(`\n⏱️ Processing Times:`)
          if (office.processingTimes) {
            const times = office.processingTimes as Record<string, any>
            console.log(JSON.stringify(times, null, 2))
          } else {
            console.log('❌ No processing times extracted')
          }
        })
      } else {
        console.log('❌ No permit offices found for this location')
      }

    } catch (error) {
      console.error(`\n❌ Error testing ${location.name}:`, error)
      if (error instanceof Error) {
        console.error('Stack trace:', error.stack)
      }
    }

    // Wait between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Scraper testing completed')
  console.log('='.repeat(80))
}

// Run the test
testScraper()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
