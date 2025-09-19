import { NextRequest, NextResponse } from 'next/server'
import { EnhancedWebScraper } from '@/lib/enhanced-web-scraper'

// API endpoint for detailed permit office information extraction
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { websiteUrl, officeName } = body

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      )
    }

    // Validate URL format
    try {
      new URL(websiteUrl)
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      )
    }

    console.log(`Starting detailed extraction for ${officeName || 'office'} at ${websiteUrl}`)

    // Create enhanced scraper
    const scraper = new EnhancedWebScraper()

    // Extract comprehensive information
    const detailedInfo = await scraper.scrapeDetailedOfficeInfo(websiteUrl)

    if (!detailedInfo) {
      return NextResponse.json(
        { error: 'Failed to extract detailed information from the website' },
        { status: 404 }
      )
    }

    console.log(`Detailed extraction completed. Data completeness: ${detailedInfo.metadata.dataCompleteness}%`)

    // Return comprehensive information
    return NextResponse.json({
      success: true,
      office: {
        basicInfo: {
          name: detailedInfo.officeName,
          department: detailedInfo.department,
          jurisdiction: detailedInfo.jurisdiction,
          website: detailedInfo.website
        },
        contactInfo: {
          address: detailedInfo.address,
          phone: detailedInfo.phone,
          email: detailedInfo.email,
          city: detailedInfo.city,
          county: detailedInfo.county,
          state: detailedInfo.state,
          zipCode: detailedInfo.zipCode
        },
        businessHours: detailedInfo.businessHours,
        services: {
          permitServices: detailedInfo.services,
          onlineServices: detailedInfo.onlineServices,
          totalServices: Object.values(detailedInfo.services).filter(Boolean).length,
          totalOnlineServices: Object.values(detailedInfo.onlineServices).filter(Boolean).length
        },
        portals: detailedInfo.portals,
        forms: {
          formCategories: detailedInfo.forms,
          totalForms: Object.values(detailedInfo.forms).reduce((sum, arr) => sum + arr.length, 0),
          formsByType: Object.entries(detailedInfo.forms).map(([type, forms]) => ({
            type,
            count: forms.length,
            forms: forms.map(form => ({
              name: form.name,
              url: form.url,
              type: form.type
            }))
          }))
        },
        staffContacts: {
          contacts: detailedInfo.staffContacts,
          totalContacts: Object.values(detailedInfo.staffContacts).filter(contact => contact?.name).length
        },
        feeStructure: detailedInfo.feeStructure,
        processInfo: detailedInfo.processInfo,
        additionalInfo: detailedInfo.additionalInfo,
        dataQuality: {
          completeness: detailedInfo.metadata.dataCompleteness,
          reliability: detailedInfo.metadata.sourceReliability,
          validationStatus: detailedInfo.metadata.validationStatus,
          scrapingMethod: detailedInfo.metadata.scrapingMethod,
          lastScraped: detailedInfo.metadata.lastScraped
        }
      },
      extractedAt: new Date().toISOString(),
      requestedOfficeName: officeName || 'Unknown Office'
    })

  } catch (error) {
    console.error('Detailed extraction error:', error)

    return NextResponse.json(
      {
        error: 'Failed to extract detailed permit office information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// GET endpoint for retrieving detailed information by URL
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const websiteUrl = searchParams.get('website')

  if (!websiteUrl) {
    return NextResponse.json(
      { error: 'Website URL parameter is required' },
      { status: 400 }
    )
  }

  try {
    // Validate URL format
    new URL(websiteUrl)

    console.log(`GET detailed extraction for: ${websiteUrl}`)

    // Create enhanced scraper
    const scraper = new EnhancedWebScraper()

    // Extract comprehensive information
    const detailedInfo = await scraper.scrapeDetailedOfficeInfo(websiteUrl)

    if (!detailedInfo) {
      return NextResponse.json(
        { error: 'Failed to extract detailed information from the website' },
        { status: 404 }
      )
    }

    // Return streamlined response for GET requests
    return NextResponse.json({
      success: true,
      basicInfo: {
        name: detailedInfo.officeName,
        department: detailedInfo.department,
        address: detailedInfo.address,
        phone: detailedInfo.phone,
        email: detailedInfo.email
      },
      services: {
        permitTypes: Object.entries(detailedInfo.services)
          .filter(([, available]) => available)
          .map(([type]) => type),
        onlineCapabilities: Object.entries(detailedInfo.onlineServices)
          .filter(([, available]) => available)
          .map(([type]) => type)
      },
      forms: {
        totalForms: Object.values(detailedInfo.forms).reduce((sum, arr) => sum + arr.length, 0),
        categories: Object.entries(detailedInfo.forms)
          .filter(([, forms]) => forms.length > 0)
          .map(([type, forms]) => ({ type, count: forms.length }))
      },
      businessHours: detailedInfo.businessHours,
      dataQuality: {
        completeness: detailedInfo.metadata.dataCompleteness,
        reliability: detailedInfo.metadata.sourceReliability
      },
      extractedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('GET detailed extraction error:', error)

    return NextResponse.json(
      {
        error: 'Failed to extract detailed permit office information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}