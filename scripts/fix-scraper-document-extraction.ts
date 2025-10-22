import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { chromium } from 'playwright'

/**
 * Fix scraper to extract fees from document links using Web Scraping skills
 */

async function fixScraperDocumentExtraction() {
  console.log('🔧 Fixing Scraper Document Extraction with Web Scraping Skills\n')

  const testUrl = 'https://www.savannahga.gov/1820/Fee-Information'
  console.log(`Testing URL: ${testUrl}`)
  console.log('='.repeat(80))

  let browser
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 1000
    })
    
    const page = await browser.newPage()
    
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    console.log('\n📄 Step 1: Loading main fee page...')
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(3000)

    // Find document links
    const documentLinks = await page.$$eval('a', links => {
      return links
        .filter(link => {
          const text = link.textContent?.toLowerCase() || ''
          const href = link.getAttribute('href') || ''
          return text.includes('fee') || 
                 text.includes('schedule') ||
                 href.includes('document') ||
                 href.includes('view') ||
                 text.includes('all development services fees')
        })
        .map(link => ({
          text: link.textContent?.trim(),
          href: link.getAttribute('href'),
          fullUrl: link.href
        }))
    })

    console.log(`\n📄 Found ${documentLinks.length} document links:`)
    documentLinks.forEach((link, i) => {
      console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`)
    })

    // Test the main document link
    const mainDocumentLink = documentLinks.find(link => 
      link.text?.toLowerCase().includes('all development services fees') ||
      link.href?.includes('document')
    )

    if (mainDocumentLink) {
      console.log(`\n🎯 Testing document link: "${mainDocumentLink.text}"`)
      console.log(`URL: ${mainDocumentLink.fullUrl}`)
      
      try {
        await page.goto(mainDocumentLink.fullUrl, { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(5000) // Wait longer for document to load

        // Check if it's a PDF or document viewer
        const isPDF = await page.evaluate(() => {
          return document.querySelector('embed[type="application/pdf"]') !== null ||
                 document.querySelector('object[type="application/pdf"]') !== null ||
                 window.location.href.includes('.pdf')
        })

        if (isPDF) {
          console.log('📄 PDF document detected - this explains why fees are not being extracted!')
          
          // Try to extract text from PDF viewer
          const pdfText = await page.evaluate(() => {
            const embed = document.querySelector('embed[type="application/pdf"]')
            const object = document.querySelector('object[type="application/pdf"]')
            
            if (embed || object) {
              // Try to get text from PDF viewer
              return document.body.innerText
            }
            return null
          })

          if (pdfText) {
            console.log(`✓ Extracted ${pdfText.length} characters from PDF`)
            
            // Look for fee data in PDF text
            const dollarMatches = pdfText.match(/\$[\d,]+\.?\d*/g)
            console.log(`💰 Dollar amounts found in PDF: ${dollarMatches ? dollarMatches.length : 0}`)
            if (dollarMatches) {
              console.log('Dollar amounts:', dollarMatches.slice(0, 10))
            }

            // Show sample content
            console.log('\n📄 PDF content (first 1000 chars):')
            console.log(pdfText.substring(0, 1000))
            console.log('...')
          }
        } else {
          // Regular HTML page
          const content = await page.evaluate(() => {
            return {
              title: document.title,
              bodyText: document.body.innerText,
              allText: document.documentElement.innerText
            }
          })

          console.log(`\n📊 Document page analysis:`)
          console.log(`✓ Title: ${content.title}`)
          console.log(`✓ Content length: ${content.bodyText.length} characters`)

          // Look for fee data
          const dollarMatches = content.bodyText.match(/\$[\d,]+\.?\d*/g)
          console.log(`💰 Dollar amounts found: ${dollarMatches ? dollarMatches.length : 0}`)
          if (dollarMatches) {
            console.log('Dollar amounts:', dollarMatches.slice(0, 10))
          }

          // Show sample content
          console.log('\n📄 Document content (first 1000 chars):')
          console.log(content.bodyText.substring(0, 1000))
          console.log('...')
        }

      } catch (error) {
        console.log(`⚠️ Could not access document: ${error}`)
      }
    } else {
      console.log('\n❌ No document links found')
    }

  } catch (error) {
    console.error(`\n❌ Error in document extraction:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 Document extraction fix completed')
  console.log('='.repeat(80))
}

// Run the fix
fixScraperDocumentExtraction()
  .then(() => {
    console.log('\n✅ Fix completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fix failed:', error)
    process.exit(1)
  })
