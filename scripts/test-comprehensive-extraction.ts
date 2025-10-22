import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { scrapeSolarPermitData } from '../src/lib/enhanced-permit-scraper'

/**
 * Comprehensive test to see what data is being extracted from government websites
 */

async function testComprehensiveExtraction() {
  console.log('🧪 Testing Comprehensive Data Extraction\n')

  // Test with a location that should have comprehensive data
  const testLocation = {
    name: 'Savannah, GA',
    city: 'Savannah',
    county: 'Chatham',
    state: 'GA',
    latitude: 32.0835,
    longitude: -81.0998
  }

  console.log(`Testing: ${testLocation.name}`)
  console.log('='.repeat(80))

  try {
    const results = await scrapeSolarPermitData({
      city: testLocation.city,
      county: testLocation.county,
      state: testLocation.state,
      latitude: testLocation.latitude,
      longitude: testLocation.longitude
    })

    console.log(`\n✅ Found ${results?.length || 0} permit office(s)`)

    if (results && results.length > 0) {
      results.forEach((office, index) => {
        console.log(`\n--- Office ${index + 1} ---`)
        console.log(`Department: ${office.departmentName}`)
        console.log(`Website: ${office.website}`)
        
        // Check permit fees
        console.log(`\n💰 Permit Fees:`)
        if (office.permitFees && Object.keys(office.permitFees).length > 0) {
          console.log(JSON.stringify(office.permitFees, null, 2))
          const feeTypes = Object.keys(office.permitFees).filter(key => office.permitFees[key])
          console.log(`✓ Found ${feeTypes.length} fee type(s): ${feeTypes.join(', ')}`)
        } else {
          console.log('❌ No permit fees found')
        }

        // Check instructions
        console.log(`\n📝 Instructions:`)
        if (office.instructions && Object.keys(office.instructions).length > 0) {
          console.log(JSON.stringify(office.instructions, null, 2))
          const instructionTypes = Object.keys(office.instructions).filter(key => office.instructions[key])
          console.log(`✓ Found ${instructionTypes.length} instruction type(s): ${instructionTypes.join(', ')}`)
        } else {
          console.log('❌ No instructions found')
        }

        // Check downloadable applications
        console.log(`\n📄 Downloadable Applications:`)
        if (office.downloadableApplications && Object.keys(office.downloadableApplications).length > 0) {
          console.log(JSON.stringify(office.downloadableApplications, null, 2))
          const appTypes = Object.keys(office.downloadableApplications).filter(key => office.downloadableApplications[key])
          console.log(`✓ Found ${appTypes.length} application type(s): ${appTypes.join(', ')}`)
        } else {
          console.log('❌ No downloadable applications found')
        }

        // Check processing times
        console.log(`\n⏱️ Processing Times:`)
        if (office.processingTimes && Object.keys(office.processingTimes).length > 0) {
          console.log(JSON.stringify(office.processingTimes, null, 2))
          const timeTypes = Object.keys(office.processingTimes).filter(key => office.processingTimes[key])
          console.log(`✓ Found ${timeTypes.length} processing time type(s): ${timeTypes.join(', ')}`)
        } else {
          console.log('❌ No processing times found')
        }

        // Check if any comprehensive data was found
        const hasAnyData = (
          (office.permitFees && Object.keys(office.permitFees).length > 0) ||
          (office.instructions && Object.keys(office.instructions).length > 0) ||
          (office.downloadableApplications && Object.keys(office.downloadableApplications).length > 0) ||
          (office.processingTimes && Object.keys(office.processingTimes).length > 0)
        )

        if (hasAnyData) {
          console.log(`\n✅ Comprehensive data extraction working`)
        } else {
          console.log(`\n❌ No comprehensive data extracted - scraper may not be working properly`)
        }
      })
    } else {
      console.log('❌ No permit offices found for this location')
    }

  } catch (error) {
    console.error(`\n❌ Error testing comprehensive extraction:`, error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Comprehensive extraction test completed')
  console.log('='.repeat(80))
}

// Run the test
testComprehensiveExtraction()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
