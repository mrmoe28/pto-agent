import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { chromium } from 'playwright'

/**
 * Fix dynamic content extraction using Browser Automation skills
 */

async function fixDynamicContentExtraction() {
  console.log('🔧 Fixing Dynamic Content Extraction with Browser Automation Skills\n')

  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  let browser
  try {
    // Launch browser with proper automation settings
    console.log('\n🌐 Step 1: Launching Browser with Automation Settings...')
    browser = await chromium.launch({ 
      headless: false, // Show browser for debugging
      slowMo: 500     // Moderate speed for observation
    })
    
    const page = await browser.newPage()
    
    // Set realistic headers and viewport
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'DNT': '1',
      'Connection': 'keep-alive',
      'Upgrade-Insecure-Requests': '1'
    })

    await page.setViewportSize({ width: 1920, height: 1080 })

    console.log('\n📄 Step 2: Navigating with proper wait conditions...')
    
    // Navigate with comprehensive wait strategy
    await page.goto(testUrl, { 
      waitUntil: 'domcontentloaded',
      timeout: 30000 
    })

    // Wait for the main content to load
    console.log('\n⏳ Step 3: Waiting for dynamic content to load...')
    
    // Wait for specific elements that indicate content is loaded
    try {
      await page.waitForSelector('main, .main-content, .content, #content', { timeout: 10000 })
      console.log('✓ Main content area found')
    } catch (e) {
      console.log('⚠️ Main content selector not found, continuing...')
    }

    // Wait for any fee-related content
    try {
      await page.waitForSelector('*:has-text("$"), *:has-text("fee"), *:has-text("cost")', { timeout: 5000 })
      console.log('✓ Fee-related content detected')
    } catch (e) {
      console.log('⚠️ No fee content detected in initial load')
    }

    // Additional wait for any AJAX/API calls to complete
    await page.waitForTimeout(3000)

    // Try to trigger any lazy loading or dynamic content
    console.log('\n🔄 Step 4: Triggering dynamic content loading...')
    
    // Scroll to trigger lazy loading
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight)
    })
    await page.waitForTimeout(1000)
    
    await page.evaluate(() => {
      window.scrollTo(0, 0)
    })
    await page.waitForTimeout(1000)

    // Check if there are any buttons or links that need to be clicked
    const clickableElements = await page.$$eval('button, a, [onclick], [data-toggle]', elements => {
      return elements
        .filter(el => {
          const text = el.textContent?.toLowerCase() || ''
          return text.includes('fee') || text.includes('cost') || text.includes('permit') || text.includes('show')
        })
        .map(el => ({
          tag: el.tagName,
          text: el.textContent?.trim(),
          href: el.getAttribute('href'),
          onclick: el.getAttribute('onclick')
        }))
    })

    console.log(`\n🔘 Found ${clickableElements.length} potentially relevant clickable elements:`)
    clickableElements.forEach((el, i) => {
      console.log(`  ${i + 1}. <${el.tag}> "${el.text}" (href: ${el.href})`)
    })

    // Try clicking on relevant elements
    for (const element of clickableElements.slice(0, 3)) {
      try {
        console.log(`\n🖱️ Clicking on: "${element.text}"`)
        await page.click(`text="${element.text}"`)
        await page.waitForTimeout(2000)
      } catch (e) {
        console.log(`⚠️ Could not click: ${element.text}`)
      }
    }

    console.log('\n🔍 Step 5: Final content analysis...')
    
    // Get the final content
    const finalContent = await page.evaluate(() => {
      return {
        title: document.title,
        bodyText: document.body.innerText,
        bodyHTML: document.body.innerHTML.substring(0, 5000), // First 5000 chars
        allText: document.documentElement.innerText
      }
    })
    
    console.log(`✓ Page title: ${finalContent.title}`)
    console.log(`✓ Body text length: ${finalContent.bodyText.length} characters`)
    console.log(`✓ All text length: ${finalContent.allText.length} characters`)
    
    // Look for fee content in the final content
    const feeMatches = finalContent.bodyText.match(/\$[\d,]+\.?\d*/g)
    console.log(`💰 Dollar amounts found: ${feeMatches ? feeMatches.length : 0}`)
    if (feeMatches) {
      console.log('Dollar amounts:', feeMatches.slice(0, 10))
    }

    // Look for fee-related keywords
    const feeKeywords = ['fee', 'cost', 'charge', 'permit fee', 'building fee', 'electrical fee']
    const foundKeywords = feeKeywords.filter(keyword => 
      finalContent.bodyText.toLowerCase().includes(keyword)
    )
    console.log(`🔑 Fee keywords found: ${foundKeywords.join(', ')}`)

    // Show the actual content
    console.log('\n📄 Final content (first 2000 chars):')
    console.log(finalContent.bodyText.substring(0, 2000))
    console.log('...')

    // Check for tables with fee data
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

  } catch (error) {
    console.error(`\n❌ Error in dynamic content extraction:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Dynamic content extraction fix completed')
  console.log('='.repeat(80))
}

// Run the fix
fixDynamicContentExtraction()
  .then(() => {
    console.log('\n✅ Fix completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error)
    process.exit(1)
  })
