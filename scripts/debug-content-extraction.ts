import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { chromium } from 'playwright'

/**
 * Debug content extraction using your web scraping skills
 */

async function debugContentExtraction() {
  console.log('🔍 Debugging Content Extraction with Web Scraping Skills\n')

  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  let browser
  try {
    // Launch browser with your web scraping expertise
    console.log('\n🌐 Step 1: Launching Browser...')
    browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 1000    // Slow down for observation
    })
    
    const page = await browser.newPage()
    
    // Set realistic headers
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    console.log('\n📄 Step 2: Navigating to page...')
    await page.goto(testUrl, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    })

    // Wait for content to load
    await page.waitForTimeout(3000)

    console.log('\n🔍 Step 3: Analyzing page content...')
    
    // Check if page loaded successfully
    const title = await page.title()
    console.log(`✓ Page title: ${title}`)
    
    // Check for common fee-related elements
    const feeElements = await page.$$eval('*', elements => {
      return elements
        .filter(el => {
          const text = el.textContent?.toLowerCase() || ''
          return text.includes('$') && (
            text.includes('fee') || 
            text.includes('cost') || 
            text.includes('charge') ||
            text.includes('permit')
          )
        })
        .map(el => ({
          tagName: el.tagName,
          text: el.textContent?.trim().substring(0, 100),
          className: el.className
        }))
        .slice(0, 10) // First 10 matches
    })
    
    console.log(`\n💰 Found ${feeElements.length} fee-related elements:`)
    feeElements.forEach((el, i) => {
      console.log(`  ${i + 1}. <${el.tagName}> ${el.text}...`)
    })

    // Extract all text content
    const fullText = await page.evaluate(() => {
      return document.body.innerText
    })
    
    console.log(`\n📊 Full text length: ${fullText.length} characters`)
    
    // Look for dollar amounts
    const dollarMatches = fullText.match(/\$[\d,]+\.?\d*/g)
    console.log(`💰 Dollar amounts found: ${dollarMatches ? dollarMatches.length : 0}`)
    if (dollarMatches) {
      console.log('Dollar amounts:', dollarMatches.slice(0, 10))
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
      const matches = fullText.match(pattern)
      console.log(`  Pattern ${index + 1}: ${matches ? matches.length : 0} matches`)
      if (matches && matches.length > 0) {
        console.log(`    Examples: ${matches.slice(0, 3).join(', ')}`)
      }
    })

    // Show first 1000 characters for manual inspection
    console.log('\n📄 First 1000 characters of content:')
    console.log(fullText.substring(0, 1000))
    console.log('...')

    // Check for specific fee table structures
    const tables = await page.$$eval('table', tables => {
      return tables.map(table => ({
        headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent?.trim()),
        rows: Array.from(table.querySelectorAll('tr')).map(tr => 
          Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.trim())
        )
      }))
    })
    
    console.log(`\n📋 Found ${tables.length} tables`)
    tables.forEach((table, i) => {
      console.log(`  Table ${i + 1}: ${table.headers.length} headers, ${table.rows.length} rows`)
      if (table.headers.some(h => h?.toLowerCase().includes('fee'))) {
        console.log(`    ✓ This table has fee-related headers: ${table.headers.join(', ')}`)
      }
    })

  } catch (error) {
    console.error(`\n❌ Error in content extraction:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Content extraction debugging completed')
  console.log('='.repeat(80))
}

// Run the debug
debugContentExtraction()
  .then(() => {
    console.log('\n✅ Debug completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Debug failed:', error)
    process.exit(1)
  })
