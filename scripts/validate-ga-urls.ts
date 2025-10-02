#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

interface PermitOffice {
  id: string
  city: string
  county: string
  state: string
  department_name: string
  website: string | null
}

async function validateUrl(url: string): Promise<{ status: number; redirected: boolean; finalUrl: string }> {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PTO-Agent/1.0; +https://pto-agent.com)'
      }
    })

    return {
      status: response.status,
      redirected: response.redirected,
      finalUrl: response.url
    }
  } catch (error) {
    return {
      status: 0,
      redirected: false,
      finalUrl: url
    }
  }
}

async function main() {
  console.log('\n🔍 Validating all Georgia permit office URLs...\n')

  const offices = await sql`
    SELECT id, city, county, state, department_name, website
    FROM permit_offices
    WHERE state = 'GA' AND active = true
    ORDER BY county, city
  ` as PermitOffice[]

  console.log(`📊 Found ${offices.length} Georgia offices\n`)

  const results: {
    working: PermitOffice[]
    broken: Array<PermitOffice & { status: number }>
    redirected: Array<PermitOffice & { finalUrl: string }>
    noWebsite: PermitOffice[]
  } = {
    working: [],
    broken: [],
    redirected: [],
    noWebsite: []
  }

  for (const office of offices) {
    if (!office.website) {
      results.noWebsite.push(office)
      console.log(`❌ ${office.county} - ${office.city}: No website`)
      continue
    }

    const validation = await validateUrl(office.website)

    if (validation.status === 0) {
      results.broken.push({ ...office, status: validation.status })
      console.log(`❌ ${office.county} - ${office.city}: Failed to connect`)
    } else if (validation.status >= 400) {
      results.broken.push({ ...office, status: validation.status })
      console.log(`❌ ${office.county} - ${office.city}: HTTP ${validation.status}`)
    } else if (validation.redirected && validation.finalUrl !== office.website) {
      results.redirected.push({ ...office, finalUrl: validation.finalUrl })
      console.log(`⚠️  ${office.county} - ${office.city}: Redirected to ${validation.finalUrl}`)
    } else {
      results.working.push(office)
      console.log(`✅ ${office.county} - ${office.city}: Working`)
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.log('\n\n📊 Summary:\n')
  console.log(`✅ Working URLs: ${results.working.length}`)
  console.log(`⚠️  Redirected URLs: ${results.redirected.length}`)
  console.log(`❌ Broken URLs: ${results.broken.length}`)
  console.log(`❌ No Website: ${results.noWebsite.length}`)

  if (results.broken.length > 0) {
    console.log('\n\n🔧 Broken URLs that need fixing:\n')
    results.broken.forEach(office => {
      console.log(`${office.county} - ${office.city}`)
      console.log(`  Current: ${office.website}`)
      console.log(`  Status: HTTP ${office.status}`)
      console.log(`  ID: ${office.id}\n`)
    })
  }

  if (results.redirected.length > 0) {
    console.log('\n\n🔄 Redirected URLs (consider updating):\n')
    results.redirected.forEach(office => {
      console.log(`${office.county} - ${office.city}`)
      console.log(`  Current: ${office.website}`)
      console.log(`  Redirect: ${office.finalUrl}`)
      console.log(`  ID: ${office.id}\n`)
    })
  }

  if (results.noWebsite.length > 0) {
    console.log('\n\n📝 Offices without websites:\n')
    results.noWebsite.forEach(office => {
      console.log(`${office.county} - ${office.city} - ${office.department_name}`)
    })
  }
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
