import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

import { chromium } from 'playwright'

/**
 * Create PDF fee extractor using Web Scraping & Data Extraction skills
 */

async function createPDFFeeExtractor() {
  console.log('📄 Creating PDF Fee Extractor with Web Scraping Skills\n')

  const testUrl = 'https://www.savannahga.gov/DocumentCenter/View/4026'
  console.log(`Testing PDF URL: ${testUrl}`)
  console.log('='.repeat(80))

  let browser
  try {
    browser = await chromium.launch({ 
      headless: false,
      slowMo: 2000
    })
    
    const page = await browser.newPage()
    
    await page.setExtraHTTPHeaders({
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    })

    console.log('\n📄 Step 1: Loading PDF document...')
    await page.goto(testUrl, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(5000) // Wait for PDF to load

    // Check if PDF is loaded
    const pdfInfo = await page.evaluate(() => {
      const embed = document.querySelector('embed[type="application/pdf"]')
      const object = document.querySelector('object[type="application/pdf"]')
      const iframe = document.querySelector('iframe')
      
      return {
        hasEmbed: !!embed,
        hasObject: !!object,
        hasIframe: !!iframe,
        url: window.location.href,
        title: document.title
      }
    })

    console.log('📊 PDF Info:', pdfInfo)

    // Try to extract text from PDF
    console.log('\n🔍 Step 2: Extracting text from PDF...')
    
    // Method 1: Try to get text from PDF viewer
    const pdfText = await page.evaluate(() => {
      // Try different methods to extract text from PDF
      const methods = [
        () => document.body.innerText,
        () => document.documentElement.innerText,
        () => {
          const embed = document.querySelector('embed[type="application/pdf"]')
          return embed ? embed.getAttribute('src') : null
        },
        () => {
          const iframe = document.querySelector('iframe')
          return iframe ? iframe.contentDocument?.body?.innerText : null
        }
      ]
      
      for (const method of methods) {
        try {
          const result = method()
          if (result && result.length > 100) {
            return result
          }
        } catch (e) {
          // Continue to next method
        }
      }
      return null
    })

    if (pdfText) {
      console.log(`✅ Extracted ${pdfText.length} characters from PDF`)
      
      // Look for fee data
      const dollarMatches = pdfText.match(/\$[\d,]+\.?\d*/g)
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
        const matches = pdfText.match(pattern)
        console.log(`  Pattern ${index + 1}: ${matches ? matches.length : 0} matches`)
        if (matches && matches.length > 0) {
          console.log(`    Examples: ${matches.slice(0, 5).join(', ')}`)
        }
      })

      // Show sample content
      console.log('\n📄 PDF content (first 2000 chars):')
      console.log(pdfText.substring(0, 2000))
      console.log('...')

      // Try to parse structured fee data
      console.log('\n📊 Step 3: Parsing structured fee data...')
      
      const feeData = parseFeeDataFromText(pdfText)
      console.log('Extracted fee data:', JSON.stringify(feeData, null, 2))

    } else {
      console.log('❌ Could not extract text from PDF')
      
      // Try alternative approach - check if we can download the PDF
      console.log('\n🔄 Step 3: Trying alternative PDF access...')
      
      const downloadInfo = await page.evaluate(() => {
        const links = Array.from(document.querySelectorAll('a'))
        return links
          .filter(link => link.href.includes('.pdf') || link.textContent?.toLowerCase().includes('download'))
          .map(link => ({
            text: link.textContent?.trim(),
            href: link.href
          }))
      })
      
      console.log(`Found ${downloadInfo.length} PDF download links:`)
      downloadInfo.forEach((link, i) => {
        console.log(`  ${i + 1}. "${link.text}" -> ${link.href}`)
      })
    }

  } catch (error) {
    console.error(`\n❌ Error in PDF extraction:`, error)
    if (error instanceof Error) {
      console.error('Message:', error.message)
    }
  } finally {
    if (browser) {
      await browser.close()
    }
  }

  console.log('\n\n' + '='.repeat(80))
  console.log('🏁 PDF fee extractor creation completed')
  console.log('='.repeat(80))
}

/**
 * Parse fee data from extracted text using Data Processing skills
 */
function parseFeeDataFromText(text: string) {
  const feeData: Record<string, any> = {}
  
  // Look for building permit fees
  const buildingFeeMatch = text.match(/building.*?permit.*?\$[\d,]+\.?\d*/gi)
  if (buildingFeeMatch) {
    feeData.building = {
      amount: parseFloat(buildingFeeMatch[0].match(/\$[\d,]+\.?\d*/)?.[0]?.replace(/[$,]/g, '') || '0'),
      description: buildingFeeMatch[0]
    }
  }
  
  // Look for electrical permit fees
  const electricalFeeMatch = text.match(/electrical.*?permit.*?\$[\d,]+\.?\d*/gi)
  if (electricalFeeMatch) {
    feeData.electrical = {
      amount: parseFloat(electricalFeeMatch[0].match(/\$[\d,]+\.?\d*/)?.[0]?.replace(/[$,]/g, '') || '0'),
      description: electricalFeeMatch[0]
    }
  }
  
  // Look for plumbing permit fees
  const plumbingFeeMatch = text.match(/plumbing.*?permit.*?\$[\d,]+\.?\d*/gi)
  if (plumbingFeeMatch) {
    feeData.plumbing = {
      amount: parseFloat(plumbingFeeMatch[0].match(/\$[\d,]+\.?\d*/)?.[0]?.replace(/[$,]/g, '') || '0'),
      description: plumbingFeeMatch[0]
    }
  }
  
  return feeData
}

// Run the extractor
createPDFFeeExtractor()
  .then(() => {
    console.log('\n✅ PDF fee extractor completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ PDF fee extractor failed:', error)
    process.exit(1)
  })
