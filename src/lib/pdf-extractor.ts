import axios from 'axios'
// @ts-expect-error - pdf-parse doesn't have TypeScript definitions
const { PDFParse } = require('pdf-parse')

/**
 * PDF Text Extractor for Government Fee Documents
 * Uses Web Scraping & Data Extraction skills to extract fee data from PDFs
 */

export interface PDFFeeData {
  building?: { amount?: number; description?: string; unit?: string }
  electrical?: { amount?: number; description?: string; unit?: string }
  plumbing?: { amount?: number; description?: string; unit?: string }
  mechanical?: { amount?: number; description?: string; unit?: string }
  zoning?: { amount?: number; description?: string; unit?: string }
  general?: { amount?: number; description?: string; unit?: string }
  feeScheduleUrl?: string
}

export interface PDFInstructions {
  general?: string
  building?: string
  electrical?: string
  plumbing?: string
  mechanical?: string
  zoning?: string
  requiredDocuments?: string[]
  applicationProcess?: string
}

export class PDFExtractor {
  private readonly TIMEOUT = 30000

  /**
   * Extract fee data from a PDF URL
   */
  async extractFeesFromPDF(pdfUrl: string): Promise<PDFFeeData> {
    try {
      console.log(`📄 Extracting fees from PDF: ${pdfUrl}`)
      
      // Download PDF
      const pdfBuffer = await this.downloadPDF(pdfUrl)
      
      // Extract text from PDF
      const pdfData = await new PDFParse(pdfBuffer)
      const text = pdfData.text || ''
      
      console.log(`✓ Extracted ${text.length} characters from PDF`)
      
      // Parse fee data from text
      const feeData = this.parseFeeDataFromText(text)
      
      return {
        ...feeData,
        feeScheduleUrl: pdfUrl
      }
      
    } catch (error) {
      console.error(`❌ Error extracting fees from PDF ${pdfUrl}:`, error)
      return {}
    }
  }

  /**
   * Extract instructions from a PDF URL
   */
  async extractInstructionsFromPDF(pdfUrl: string): Promise<PDFInstructions> {
    try {
      console.log(`📄 Extracting instructions from PDF: ${pdfUrl}`)
      
      // Download PDF
      const pdfBuffer = await this.downloadPDF(pdfUrl)
      
      // Extract text from PDF
      const pdfData = await new PDFParse(pdfBuffer)
      const text = pdfData.text || ''
      
      console.log(`✓ Extracted ${text.length} characters from PDF`)
      
      // Parse instructions from text
      const instructions = this.parseInstructionsFromText(text)
      
      return instructions
      
    } catch (error) {
      console.error(`❌ Error extracting instructions from PDF ${pdfUrl}:`, error)
      return {}
    }
  }

  /**
   * Download PDF from URL
   */
  private async downloadPDF(url: string): Promise<Buffer> {
    const response = await axios.get(url, {
      responseType: 'arraybuffer',
      timeout: this.TIMEOUT,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/2.0; +https://permitoffices.com/bot)'
      }
    })
    
    return Buffer.from(response.data)
  }

  /**
   * Parse fee data from PDF text using Data Processing skills
   */
  private parseFeeDataFromText(text: string): PDFFeeData {
    const feeData: PDFFeeData = {}
    const lines = text.split('\n')
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      
      // Skip lines without dollar signs
      if (!lowerLine.includes('$')) continue
      
      // Extract dollar amount
      const dollarMatch = line.match(/\$[\d,]+\.?\d*/)
      if (!dollarMatch) continue
      
      const amount = parseFloat(dollarMatch[0].replace(/[$,]/g, ''))
      const description = line.trim()
      
      // Categorize by permit type
      if (lowerLine.includes('building') && lowerLine.includes('permit')) {
        feeData.building = { amount, description }
      } else if (lowerLine.includes('electrical') && lowerLine.includes('permit')) {
        feeData.electrical = { amount, description }
      } else if (lowerLine.includes('plumbing') && lowerLine.includes('permit')) {
        feeData.plumbing = { amount, description }
      } else if (lowerLine.includes('mechanical') && lowerLine.includes('permit')) {
        feeData.mechanical = { amount, description }
      } else if (lowerLine.includes('zoning') && lowerLine.includes('permit')) {
        feeData.zoning = { amount, description }
      } else if (lowerLine.includes('permit') || lowerLine.includes('fee')) {
        // General permit fee
        if (!feeData.general) {
          feeData.general = { amount, description }
        }
      }
    }
    
    return feeData
  }

  /**
   * Parse instructions from PDF text
   */
  private parseInstructionsFromText(text: string): PDFInstructions {
    const instructions: PDFInstructions = {}
    const lines = text.split('\n')
    
    let currentSection = ''
    let currentContent: string[] = []
    
    for (const line of lines) {
      const lowerLine = line.toLowerCase()
      
      // Detect instruction sections
      if (lowerLine.includes('application process') || lowerLine.includes('how to apply')) {
        if (currentSection && currentContent.length > 0) {
          instructions[currentSection as keyof PDFInstructions] = currentContent.join('\n')
        }
        currentSection = 'general'
        currentContent = []
      } else if (lowerLine.includes('required documents') || lowerLine.includes('documents needed')) {
        if (currentSection && currentContent.length > 0) {
          instructions[currentSection as keyof PDFInstructions] = currentContent.join('\n')
        }
        currentSection = 'requiredDocuments'
        currentContent = []
      } else if (lowerLine.includes('building permit') && lowerLine.includes('instruction')) {
        if (currentSection && currentContent.length > 0) {
          instructions[currentSection as keyof PDFInstructions] = currentContent.join('\n')
        }
        currentSection = 'building'
        currentContent = []
      } else if (lowerLine.includes('electrical permit') && lowerLine.includes('instruction')) {
        if (currentSection && currentContent.length > 0) {
          instructions[currentSection as keyof PDFInstructions] = currentContent.join('\n')
        }
        currentSection = 'electrical'
        currentContent = []
      } else if (currentSection && line.trim()) {
        currentContent.push(line.trim())
      }
    }
    
    // Add final section
    if (currentSection && currentContent.length > 0) {
      instructions[currentSection as keyof PDFInstructions] = currentContent.join('\n')
    }
    
    return instructions
  }

  /**
   * Find PDF links on a webpage
   */
  async findPDFLinks(pageUrl: string): Promise<string[]> {
    try {
      const response = await axios.get(pageUrl, {
        timeout: this.TIMEOUT,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; PermitOfficeBot/2.0; +https://permitoffices.com/bot)'
        }
      })
      
      const html = response.data
      const pdfLinks: string[] = []
      
      // Find PDF links in HTML
      const pdfLinkRegex = /href=["']([^"']*\.pdf[^"']*)["']/gi
      let match
      while ((match = pdfLinkRegex.exec(html)) !== null) {
        const link = match[1]
        if (link.startsWith('http')) {
          pdfLinks.push(link)
        } else if (link.startsWith('/')) {
          const baseUrl = new URL(pageUrl).origin
          pdfLinks.push(`${baseUrl}${link}`)
        }
      }
      
      // Also look for document center links
      const documentCenterRegex = /href=["']([^"']*\/DocumentCenter\/View\/[^"']*)["']/gi
      while ((match = documentCenterRegex.exec(html)) !== null) {
        const link = match[1]
        if (link.startsWith('http')) {
          pdfLinks.push(link)
        } else if (link.startsWith('/')) {
          const baseUrl = new URL(pageUrl).origin
          pdfLinks.push(`${baseUrl}${link}`)
        }
      }
      
      return [...new Set(pdfLinks)] // Remove duplicates
      
    } catch (error) {
      console.error(`❌ Error finding PDF links on ${pageUrl}:`, error)
      return []
    }
  }
}
