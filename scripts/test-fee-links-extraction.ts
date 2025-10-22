import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { chromium } from 'playwright'

/**
 * Test fee links extraction using Data Processing skills
 */

async function testFeeLinksExtraction() {
  console.log('🔗 Testing Fee Links Extraction with Data Processing Skills\n')

  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  let browser
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 500
    })
    
    const page = await browser.newPage()
    
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    console.log('\n📄 Step 1: Loading main fee page...')
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Find all fee-related links
    const feeLinks = await page.$$eval('a', links => {
      return links
        .filter(link => {
          const text = link.textContent?.toLowerCase() || ''
          const href = link.getAttribute('href') || ''
          return text.includes('fee') || 
                 text.includes('cost') || 
                 text.includes('charge') ||
                 href.includes('fee') ||
                 href.includes('cost')
        })
        .map(link => ({
          text: link.textContent?.trim(),
          href: link.getAttribute('href'),
          fullUrl: link.href
        }))
    })

    console.log(`\n🔗 Found ${feeLinks.length} fee-related links:`)
    feeLinks.forEach((link, i) => {
      console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`)
    })

    // Test the most promising fee link
    const mainFeeLink = feeLinks.find(link => 
      link.text?.toLowerCase().includes('all development services fees') ||
      link.text?.toLowerCase().includes('fee schedule') ||
      link.text?.toLowerCase().includes('fee information')
    )

    if (mainFeeLink) {
      console.log(`\n🎯 Testing main fee link: "${mainFeeLink.text}"`)
      console.log(`URL: ${mainFeeLink.fullUrl}`)
      
      await page.goto(mainFeeLink.fullUrl, { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(3000)

      // Extract content from the fee page
      const feeContent = await page.evaluate(() => {
        return {
          title: document.title,
          bodyText: document.body.innerText,
          allText: document.documentElement.innerText
        }
      })

      console.log(`\n📊 Fee page analysis:`)
      console.log(`✓ Title: ${feeContent.title}`)
      console.log(`✓ Content length: ${feeContent.bodyText.length} characters`)

      // Look for dollar amounts
      const dollarMatches = feeContent.bodyText.match(/\$[\d,]+\.?\d*/g)
      console.log(`💰 Dollar amounts found: ${dollarMatches ? dollarMatches.length : 0}`)
      if (dollarMatches) {
        console.log('Dollar amounts:', dollarMatches.slice(0, 20))
      }

      // Look for fee patterns
      const feePatterns = [
        /fee.*?\$[\d,]+\.?\d*/gi,
        /cost.*?\$[\d,]+\.?\d*/gi,
        /charge.*?\$[\d,]+\.?\d*/gi,
        /\$[\d,]+\.?\d*\s*(?:per|for|each)/gi
      ]
      
      console.log('\n🔍 Fee pattern analysis:')
      feePatterns.forEach((pattern, index) => {
        const matches = feeContent.bodyText.match(pattern)
        console.log(`  Pattern ${index + 1}: ${matches ? matches.length : 0} matches`)
        if (matches && matches.length > 0) {
          console.log(`    Examples: ${matches.slice(0, 5).join(', ')}`)
        }
      })

      // Check for tables
      const tables = await page.$$eval('table', tables => {
        return tables.map(table => ({
          headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()),
          rows: Array.from(table.querySelectorAll('tr')).map(tr => 
            Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim())
          ).filter(row => row.some(cell => cell && cell.length > 0))
        }))
      })
      
      console.log(`\n📋 Found ${tables.length} tables`)
      tables.forEach((table, i) => {
        console.log(`  Table ${i + 1}: ${table.headers.length} headers, ${table.rows.length} rows`)
        if (table.headers.some(h => h?.toLowerCase().includes('fee'))) {
          console.log(`    ✓ Fee table found! Headers: ${table.headers.join(', ')}`)
          console.log(`    Sample rows:`, table.rows.slice(0, 3))
        }
      })

      // Show sample content
      console.log('\n📄 Sample content (first 1500 chars):')
      console.log(feeContent.bodyText.substring(0, 1500))
      console.log('...')

    } else {
      console.log('\n❌ No main fee link found')
    }

  } catch (error) {
    console.error(`\n❌ Error in fee links extraction:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Fee links extraction test completed')
  console.log('='.repeat(80))
}

// Run the test
testFeeLinksExtraction()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
