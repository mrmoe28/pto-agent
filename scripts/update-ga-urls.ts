#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

interface URLUpdate {
  id: string
  oldUrl: string
  newUrl: string
  reason: string
}

const urlUpdates: URLUpdate[] = [
  // Alpharetta - working URL
  {
    id: '4ad1b409-b48e-436f-b08e-68542b34dec1',
    oldUrl: 'https://www.alpharetta.ga.us/departments/community-development',
    newUrl: 'https://www.alpharetta.ga.us/government/departments/community-development',
    reason: 'Updated to correct URL path'
  },

  // Atlanta - Office of Buildings
  {
    id: '9670760f-8602-4689-9bf5-60752cca9581',
    oldUrl: 'https://www.atlantaga.gov/government/departments/city-planning/office-of-buildings',
    newUrl: 'https://www.atlantaga.gov/government/departments/city-planning/about-dcp/office-of-buildings',
    reason: 'Updated to correct URL path for Office of Buildings'
  },

  // Atlanta - Bureau of Buildings (now Office of Buildings)
  {
    id: '53934f1b-d735-480e-9d13-dd88d58d117f',
    oldUrl: 'https://www.atlantaga.gov/government/departments/city-planning/bureau-of-buildings',
    newUrl: 'https://www.atlantaga.gov/government/departments/city-planning/zoning-development-permitting-services/online-permitting',
    reason: 'Bureau of Buildings now part of Office of Buildings - using online permitting page'
  },

  // Fulton County
  {
    id: '561ca947-b413-4091-916c-0affb56107dd',
    oldUrl: 'https://www.fultoncountyga.gov/services/building-permits-and-inspections',
    newUrl: 'https://www.fultoncountyga.gov/business-services/permits-and-inspections',
    reason: 'Updated to correct URL path'
  },

  // Savannah - Development Services
  {
    id: '89fa57e6-2f07-43b8-9cce-cb239b7727a4',
    oldUrl: 'https://www.savannahga.gov/1072/Development-Services',
    newUrl: 'https://www.savannahga.gov/375/Development-Services-Department',
    reason: 'Updated to correct Department URL'
  },

  // Savannah - Development Services (duplicate)
  {
    id: 'b93f6cbc-4261-4160-b1c5-bcc26238133f',
    oldUrl: 'https://www.savannahga.gov/1072/Development-Services',
    newUrl: 'https://www.savannahga.gov/892/Building-Permits',
    reason: 'Updated to Building Permits page'
  },

  // DeKalb County
  {
    id: 'd81122d2-c0b8-4f01-abe5-8b159b6e9602',
    oldUrl: 'https://www.dekalbcountyga.gov/planning-development',
    newUrl: 'https://www.dekalbcountyga.gov/planning-and-sustainability/building-permits',
    reason: 'Updated to correct URL path for building permits'
  },

  // DeKalb - Decatur (City)
  {
    id: 'e8ef38a2-9805-40eb-b4c5-2f437649bd72',
    oldUrl: 'https://www.decaturga.com/community-development',
    newUrl: 'https://www.dekalbcountyga.gov/planning-and-sustainability/e-permitting',
    reason: 'Using county ePermitting portal'
  },

  // DeKalb - Planning Sustainability
  {
    id: 'e75b1c95-dc70-453a-a6b9-54419db866f3',
    oldUrl: 'https://www.dekalbcountyga.gov/planning-sustainability',
    newUrl: 'https://www.dekalbcountyga.gov/planning-and-sustainability/permits-plan-review-inspections',
    reason: 'Updated to permits page'
  },

  // Roswell
  {
    id: '9693c8e8-1b15-4374-a7f2-2344a1a3cefe',
    oldUrl: 'https://www.roswellgov.com/government/departments/community-development',
    newUrl: 'https://www.roswellgov.com/government/departments/community-development/building-permits',
    reason: 'Updated to building permits page'
  },

  // Sandy Springs
  {
    id: '3189d5b9-debb-4fe2-80d0-63a984bc501d',
    oldUrl: 'https://www.sandyspringsga.gov/government/departments/community-development',
    newUrl: 'https://www.sandyspringsga.gov/government/city-departments/community-development/building-permits',
    reason: 'Updated to building permits page'
  },

  // Sandy Springs (duplicate)
  {
    id: '77b1aa27-1815-419b-8c85-72a17e55ace0',
    oldUrl: 'https://www.sandyspringsga.gov/government/city-departments/community-development',
    newUrl: 'https://www.sandyspringsga.gov/government/city-departments/community-development/building-permits',
    reason: 'Updated to building permits page'
  },

  // Lawrenceville
  {
    id: '2d141b17-7ba3-4e93-b6ca-d1034c34239e',
    oldUrl: 'https://www.lawrencevillega.org/departments/development-services',
    newUrl: 'https://www.lawrencevillega.org/government/departments/planning-community-development',
    reason: 'Updated to correct department page'
  },

  // Henry County - McDonough (keep existing, should work)
  {
    id: '61ea9887-2184-4d31-adf5-3b35013f61b3',
    oldUrl: 'https://www.henrycounty-ga.com/Departments/Development',
    newUrl: 'https://www.co.henry.ga.us/Departments/Development-Services',
    reason: 'Updated to correct county domain'
  },

  // Redirected URLs - update to final destination

  // Marietta (Boards redirect)
  {
    id: '87e1e23f-391a-4871-a2ad-ba7a70d82710',
    oldUrl: 'https://www.mariettaga.gov/152/Development-Services',
    newUrl: 'https://www.mariettaga.gov/government/departments/community-development',
    reason: 'Updated to correct department page'
  },

  // Cobb County (.org to .gov)
  {
    id: 'bd59513e-e840-47b0-986e-01c912af8b0c',
    oldUrl: 'https://www.cobbcounty.org/community-development',
    newUrl: 'https://www.cobbcounty.gov/community-development',
    reason: 'Updated domain from .org to .gov'
  },

  // Columbus
  {
    id: 'f5c1c097-8933-40ff-a315-cd368ccbffc9',
    oldUrl: 'https://www.columbusga.gov/inspections',
    newUrl: 'https://www.columbusga.gov/inspections-and-code-2',
    reason: 'Updated to redirected URL'
  },

  // Augusta (plot plans redirect)
  {
    id: 'a5e126e0-304a-4bbe-a99d-129edfabe531',
    oldUrl: 'https://www.augustaga.gov/1100/Planning-Development',
    newUrl: 'https://www.augustaga.gov/1100/Planning-Development',
    reason: 'Keep original - redirect to Plot Plans is temporary'
  }
]

async function main() {
  console.log(`\n🔧 Updating ${urlUpdates.length} Georgia office URLs...\n`)

  let successCount = 0
  let errorCount = 0

  for (const update of urlUpdates) {
    try {
      const result = await sql`
        UPDATE permit_offices
        SET website = ${update.newUrl}
        WHERE id = ${update.id}
        RETURNING city, county, department_name
      `

      if (result.length > 0) {
        const office = result[0]
        console.log(`✅ Updated ${office.county} - ${office.city}`)
        console.log(`   ${update.reason}`)
        console.log(`   Old: ${update.oldUrl}`)
        console.log(`   New: ${update.newUrl}\n`)
        successCount++
      } else {
        console.log(`⚠️  No office found with ID: ${update.id}\n`)
      }
    } catch (error) {
      console.error(`❌ Error updating ${update.id}:`, error)
      errorCount++
    }
  }

  console.log(`\n📊 Summary:`)
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors: ${errorCount}`)
  console.log(`📝 Total processed: ${urlUpdates.length}`)
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
