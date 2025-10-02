import { NextRequest, NextResponse } from 'next/server';
import { scrapePermitForms } from '@/lib/form-scraper';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { websiteUrl, officeName } = body;

    if (!websiteUrl) {
      return NextResponse.json(
        { error: 'Website URL is required' },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(websiteUrl);
    } catch {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    console.log(`Scraping forms for ${officeName || 'office'} at ${websiteUrl}`);

    // Scrape the forms from the website
    const forms = await scrapePermitForms(websiteUrl);

    // Count total forms found
    const totalForms = Object.values(forms).reduce(
      (total, formArray) => total + formArray.length,
      0
    );

    console.log(`Found ${totalForms} forms for ${officeName || 'office'}`);

    // If no forms found, return "not available" status
    if (totalForms === 0) {
      return NextResponse.json({
        success: true,
        forms,
        totalForms: 0,
        available: false,
        message: 'No permit application forms found on this website',
        scrapedAt: new Date().toISOString(),
        website: websiteUrl,
        officeName: officeName || 'Unknown Office'
      });
    }

    return NextResponse.json({
      success: true,
      forms,
      totalForms,
      available: true,
      scrapedAt: new Date().toISOString(),
      website: websiteUrl,
      officeName: officeName || 'Unknown Office'
    });

  } catch (error) {
    console.error('Error scraping permit forms:', error);

    return NextResponse.json(
      {
        error: 'Failed to scrape permit forms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const websiteUrl = searchParams.get('website');

  if (!websiteUrl) {
    return NextResponse.json(
      { error: 'Website URL parameter is required' },
      { status: 400 }
    );
  }

  try {
    // Validate URL format
    new URL(websiteUrl);

    console.log(`Scraping forms for website: ${websiteUrl}`);

    // Scrape the forms from the website
    const forms = await scrapePermitForms(websiteUrl);

    // Count total forms found
    const totalForms = Object.values(forms).reduce(
      (total, formArray) => total + formArray.length,
      0
    );

    // If no forms found, return "not available" status
    if (totalForms === 0) {
      return NextResponse.json({
        success: true,
        forms,
        totalForms: 0,
        available: false,
        message: 'No permit application forms found on this website',
        scrapedAt: new Date().toISOString(),
        website: websiteUrl
      });
    }

    return NextResponse.json({
      success: true,
      forms,
      totalForms,
      available: true,
      scrapedAt: new Date().toISOString(),
      website: websiteUrl
    });

  } catch (error) {
    console.error('Error scraping permit forms:', error);

    return NextResponse.json(
      {
        error: 'Failed to scrape permit forms',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}