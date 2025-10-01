#!/usr/bin/env tsx

/**
 * Test script to deep crawl existing Georgia permit offices
 * This creates a blueprint of data patterns for expansion to other states
 */

import { sql } from '@/lib/neon'
import { DeepPermitCrawler, type PermitRequirements } from '@/lib/deep-crawler'
import * as fs from 'fs'
import * as path from 'path'

interface PermitOfficeRow {
  id: string
  city: string
  county: string
  state: string
  website: string | null
  department_name: string
}

async function main() {
  console.log('🔍 Fetching Georgia permit offices from database...\n')

  // Fetch offices from database
  const result = await sql`
    SELECT id, city, county, state, website, department_name
    FROM permit_offices
    WHERE state = 'GA'
      AND active = true
      AND website IS NOT NULL
    ORDER BY city
    LIMIT 5
  `

  const offices = result as unknown as PermitOfficeRow[]

  console.log(`Found ${offices.length} Georgia offices with websites\n`)

  const results: Array<{
    office: PermitOfficeRow
    data: PermitRequirements
    quality: {
      hasInstructions: boolean
      hasFees: boolean
      hasTimelines: boolean
      hasContacts: boolean
      hasForms: boolean
      totalDataPoints: number
    }
  }> = []

  // Crawl each office
  for (const office of offices) {
    if (!office.website) continue

    console.log(`\n${'='.repeat(80)}`)
    console.log(`📍 Crawling: ${office.city}, ${office.county} County`)
    console.log(`🌐 Website: ${office.website}`)
    console.log(`${'='.repeat(80)}\n`)

    try {
      const crawler = new DeepPermitCrawler()
      const data = await crawler.crawlSite(office.website, {
        maxDepth: 4,
        maxPages: 15,
        followExternal: false,
        targetPaths: [
          '/permit', '/solar', '/electrical', '/renewable',
          '/application', '/form', '/fee', '/requirement',
          '/instruction', '/timeline', '/process', '/checklist'
        ],
        extractPDFs: true
      })

      // Calculate quality metrics
      const quality = {
        hasInstructions: data.stepByStep.length > 0 || data.generalInstructions.length > 0,
        hasFees: data.fees.length > 0,
        hasTimelines: data.timelines.length > 0,
        hasContacts: data.contacts.length > 0,
        hasForms: data.onlineForms.length > 0 || data.downloadableForms.length > 0,
        totalDataPoints: (
          data.stepByStep.length +
          data.generalInstructions.length +
          data.requiredDocuments.length +
          data.fees.length +
          data.timelines.length +
          data.contacts.length +
          data.onlineForms.length +
          data.downloadableForms.length
        )
      }

      results.push({ office, data, quality })

      // Print summary
      console.log('✅ Crawl complete!')
      console.log(`   📋 Instructions: ${data.stepByStep.length}`)
      console.log(`   📄 Required docs: ${data.requiredDocuments.length}`)
      console.log(`   💰 Fee structures: ${data.fees.length}`)
      console.log(`   ⏱️  Timelines: ${data.timelines.length}`)
      console.log(`   📞 Contacts: ${data.contacts.length}`)
      console.log(`   📝 Online forms: ${data.onlineForms.length}`)
      console.log(`   📥 Downloadable forms: ${data.downloadableForms.length}`)
      console.log(`   📊 Total data points: ${quality.totalDataPoints}`)

    } catch (error) {
      console.error(`❌ Error crawling ${office.city}:`, error)
    }

    // Add delay between requests to be respectful
    await new Promise(resolve => setTimeout(resolve, 2000))
  }

  // Generate summary report
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('📊 DEEP CRAWL SUMMARY REPORT')
  console.log(`${'='.repeat(80)}\n`)

  const totalOffices = results.length
  const officesWithInstructions = results.filter(r => r.quality.hasInstructions).length
  const officesWithFees = results.filter(r => r.quality.hasFees).length
  const officesWithTimelines = results.filter(r => r.quality.hasTimelines).length
  const officesWithContacts = results.filter(r => r.quality.hasContacts).length
  const officesWithForms = results.filter(r => r.quality.hasForms).length

  console.log(`Total offices crawled: ${totalOffices}`)
  console.log(`With instructions: ${officesWithInstructions} (${Math.round(officesWithInstructions/totalOffices*100)}%)`)
  console.log(`With fee data: ${officesWithFees} (${Math.round(officesWithFees/totalOffices*100)}%)`)
  console.log(`With timeline data: ${officesWithTimelines} (${Math.round(officesWithTimelines/totalOffices*100)}%)`)
  console.log(`With contact data: ${officesWithContacts} (${Math.round(officesWithContacts/totalOffices*100)}%)`)
  console.log(`With forms: ${officesWithForms} (${Math.round(officesWithForms/totalOffices*100)}%)`)

  // Identify patterns
  console.log(`\n\n${'='.repeat(80)}`)
  console.log('🔍 DATA PATTERNS IDENTIFIED')
  console.log(`${'='.repeat(80)}\n`)

  // Common fee structures
  const allFees = results.flatMap(r => r.data.fees)
  const baseFees = allFees.filter(f => f.baseFee !== undefined).map(f => f.baseFee as number)
  const variableFees = allFees.filter(f => f.variableFee)

  console.log('💰 Fee Structures:')
  console.log(`   Base fees found: ${baseFees.length}`)
  if (baseFees.length > 0) {
    console.log(`   Range: $${Math.min(...baseFees)} - $${Math.max(...baseFees)}`)
    console.log(`   Average: $${Math.round(baseFees.reduce((a, b) => a + b, 0) / baseFees.length)}`)
  }
  console.log(`   Variable fees (per kW/SF): ${variableFees.length}`)

  // Common timeline ranges
  const allTimelines = results.flatMap(r => r.data.timelines)
  const timelineRanges = allTimelines.filter(t => t.minDays !== undefined && t.maxDays !== undefined)

  console.log('\n⏱️  Processing Timelines:')
  console.log(`   Timeline entries found: ${allTimelines.length}`)
  if (timelineRanges.length > 0) {
    const avgMin = Math.round(timelineRanges.reduce((a, t) => a + (t.minDays ?? 0), 0) / timelineRanges.length)
    const avgMax = Math.round(timelineRanges.reduce((a, t) => a + (t.maxDays ?? 0), 0) / timelineRanges.length)
    console.log(`   Typical range: ${avgMin}-${avgMax} days`)
  }

  // Common required documents
  const allDocs = results.flatMap(r => r.data.requiredDocuments)
  const docFrequency = allDocs.reduce((acc, doc) => {
    acc[doc] = (acc[doc] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  console.log('\n📄 Most Common Required Documents:')
  Object.entries(docFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .forEach(([doc, count]) => {
      console.log(`   ${count}x - ${doc.slice(0, 60)}${doc.length > 60 ? '...' : ''}`)
    })

  // Save detailed results to JSON
  const outputDir = path.join(process.cwd(), 'crawl-results')
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true })
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const outputFile = path.join(outputDir, `ga-deep-crawl-${timestamp}.json`)

  fs.writeFileSync(outputFile, JSON.stringify(results, null, 2))

  console.log(`\n\n✅ Full results saved to: ${outputFile}`)
  console.log(`\n${'='.repeat(80)}\n`)
}

main()
  .then(() => {
    console.log('✅ Deep crawl test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Deep crawl test failed:', error)
    process.exit(1)
  })
