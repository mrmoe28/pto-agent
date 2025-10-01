#!/usr/bin/env tsx

import { analyzeJurisdiction } from '@/lib/jurisdiction-analyzer'

console.log('\n🧠 Testing Intelligent Jurisdiction Analyzer\n')
console.log('='.repeat(70))

const testCases = [
  {
    name: 'Chamblee, GA (Unincorporated)',
    components: { city: 'Chamblee', county: 'DeKalb', state: 'GA' }
  },
  {
    name: 'Atlanta, GA (Major City)',
    components: { city: 'Atlanta', county: 'Fulton', state: 'GA' }
  },
  {
    name: 'Conley, GA (Unincorporated)',
    components: { city: 'Conley', county: 'Henry', state: 'GA' }
  },
  {
    name: 'Alpharetta, GA (Incorporated)',
    components: { city: 'Alpharetta', county: 'Fulton', state: 'GA' }
  },
  {
    name: 'Savannah, GA (Incorporated)',
    components: { city: 'Savannah', county: 'Chatham', state: 'GA' }
  },
  {
    name: 'Unknown City, GA',
    components: { city: 'Flowery Branch', county: 'Hall', state: 'GA' }
  },
  {
    name: 'County Only',
    components: { city: null, county: 'Cobb', state: 'GA' }
  }
]

testCases.forEach(test => {
  console.log(`\n📍 ${test.name}`)
  console.log('-'.repeat(70))

  const analysis = analyzeJurisdiction(test.components)

  console.log(`   Search Level:    ${analysis.searchLevel}`)
  console.log(`   Confidence:      ${analysis.confidence}`)
  console.log(`   Search Order:    ${analysis.suggestedOrder.join(' → ')}`)
  console.log(`   Reason:          ${analysis.reason}`)

  // Show what query would be executed
  if (analysis.suggestedOrder[0] === 'county') {
    console.log(`   ✅ Will search:   County permit offices FIRST`)
    console.log(`                     (Then fallback to city if needed)`)
  } else {
    console.log(`   ✅ Will search:   City permit offices FIRST`)
    console.log(`                     (Then fallback to county if needed)`)
  }
})

console.log('\n' + '='.repeat(70))
console.log('\n✨ Summary:\n')
console.log('   • Chamblee → County-first (unincorporated)')
console.log('   • Conley → County-only (unincorporated)')
console.log('   • Atlanta → City-first (major city)')
console.log('   • Alpharetta → City-first (incorporated)')
console.log('   • Unknown cities → County-first (safer)')
console.log('')
