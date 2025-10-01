#!/usr/bin/env tsx

import { sql } from '@/lib/neon'

async function main() {
  await sql`UPDATE permit_offices SET website = 'https://www.alpharetta.ga.us/157/Community-Development' WHERE id = '4ad1b409-b48e-436f-b08e-68542b34dec1'`
  await sql`UPDATE permit_offices SET website = 'https://www.henrycountyga.gov/departments/development-services' WHERE id = '61ea9887-2184-4d31-adf5-3b35013f61b3'`

  console.log('✅ Updated 2 redirected URLs')
}

main().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); })
