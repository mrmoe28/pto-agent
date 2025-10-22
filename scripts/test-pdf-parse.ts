import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') })

/**
 * Test pdf-parse library import and usage
 */

async function testPDFParse() {
  console.log('🧪 Testing pdf-parse library\n')

  try {
    // Test different import methods
    console.log('Testing import method 1: import pdf from "pdf-parse"')
    const pdf1 = await import('pdf-parse')
    console.log('✓ Import successful:', typeof pdf1.default)
    
    console.log('\nTesting import method 2: require("pdf-parse")')
    const pdf2 = require('pdf-parse')
    console.log('✓ Require successful:', typeof pdf2)
    
    console.log('\nTesting import method 3: import * as pdf from "pdf-parse"')
    const pdf3 = await import('pdf-parse')
    console.log('✓ Import * successful:', typeof pdf3)
    
    // Test with a simple buffer
    console.log('\n📄 Testing PDF parsing with dummy data...')
    const dummyBuffer = Buffer.from('dummy pdf content')
    
    try {
      const result1 = await pdf1.default(dummyBuffer)
      console.log('✓ pdf1.default() works')
    } catch (e) {
      console.log('❌ pdf1.default() failed:', e.message)
    }
    
    try {
      const result2 = await pdf2(dummyBuffer)
      console.log('✓ pdf2() works')
    } catch (e) {
      console.log('❌ pdf2() failed:', e.message)
    }
    
    try {
      const result3 = await pdf3.default(dummyBuffer)
      console.log('✓ pdf3.default() works')
    } catch (e) {
      console.log('❌ pdf3.default() failed:', e.message)
    }

  } catch (error) {
    console.error('❌ Error testing pdf-parse:', error)
  }

  console.log('\n✅ PDF parse test completed')
}

testPDFParse()
  .then(() => {
    console.log('\n✅ Test completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
