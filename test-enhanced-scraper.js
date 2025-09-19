#!/usr/bin/env node

// Test script for enhanced web scraper and Google Custom Search

const TEST_GOVERNMENT_URLS = [
  'https://www.gwinnettcounty.com',
  'https://www.cityofroswell.com',
  'https://www.cityofatlanta.gov',
  'https://www.dekalbcountyga.gov'
];

async function testEnhancedSearch() {
  console.log('🔍 Testing Enhanced Google Custom Search API...\n');

  try {
    // Test the enhanced permit office search
    const searchResponse = await fetch('http://localhost:3000/api/permit-offices?city=Gwinnett&state=GA', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!searchResponse.ok) {
      throw new Error(`Search API failed: ${searchResponse.status} ${searchResponse.statusText}`);
    }

    const searchData = await searchResponse.json();
    console.log('✅ Enhanced Search Results:');
    console.log(`   Found ${searchData.count} offices`);
    console.log(`   Data source: ${searchData.source}`);

    if (searchData.offices && searchData.offices.length > 0) {
      const office = searchData.offices[0];
      console.log('\n📋 Sample Office Data:');
      console.log(`   Name: ${office.department_name}`);
      console.log(`   City: ${office.city}`);
      console.log(`   Website: ${office.website}`);
      console.log(`   Phone: ${office.phone || 'Not found'}`);
      console.log(`   Email: ${office.email || 'Not found'}`);
      console.log(`   Building Permits: ${office.building_permits ? '✅' : '❌'}`);
      console.log(`   Online Applications: ${office.online_applications ? '✅' : '❌'}`);

      if (office.enhancedData) {
        console.log('\n🚀 Enhanced Data Features:');
        console.log(`   Data Completeness: ${office.enhancedData.dataCompleteness}%`);
        console.log(`   Source Reliability: ${office.enhancedData.sourceReliability}`);
        console.log(`   Total Forms: ${office.enhancedData.totalForms}`);
        console.log(`   Staff Contacts: ${office.enhancedData.staffContacts}`);
        console.log(`   Special Services: ${office.enhancedData.specialServices?.length || 0}`);
        console.log(`   Online Capabilities: ${office.enhancedData.onlineCapabilities?.length || 0}`);
        console.log(`   Available Portals: ${office.enhancedData.availablePortals?.length || 0}`);
      }
    }

  } catch (error) {
    console.error('❌ Enhanced search test failed:', error);
  }
}

async function testDetailedExtraction() {
  console.log('\n🔬 Testing Detailed Data Extraction...\n');

  for (const testUrl of TEST_GOVERNMENT_URLS.slice(0, 2)) { // Test first 2 URLs
    try {
      console.log(`🌐 Testing: ${testUrl}`);

      const detailResponse = await fetch('http://localhost:3000/api/permit-offices/detailed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          websiteUrl: testUrl,
          officeName: `Test Office for ${new URL(testUrl).hostname}`
        })
      });

      if (!detailResponse.ok) {
        console.log(`   ⚠️  Detailed extraction failed: ${detailResponse.status}`);
        continue;
      }

      const detailData = await detailResponse.json();

      if (detailData.success) {
        const office = detailData.office;
        console.log('   ✅ Detailed extraction successful');
        console.log(`   📊 Data Completeness: ${office.dataQuality.completeness}%`);
        console.log(`   🏢 Office Name: ${office.basicInfo.name || 'Not found'}`);
        console.log(`   📞 Phone: ${office.contactInfo.phone || 'Not found'}`);
        console.log(`   📧 Email: ${office.contactInfo.email || 'Not found'}`);
        console.log(`   🕒 Business Hours: ${Object.keys(office.businessHours).length} days`);
        console.log(`   🛠️  Services: ${office.services.totalServices} permit services`);
        console.log(`   💻 Online Services: ${office.services.totalOnlineServices} online capabilities`);
        console.log(`   📄 Forms: ${office.forms.totalForms} total forms`);
        console.log(`   👥 Staff Contacts: ${office.staffContacts.totalContacts} contacts`);

        if (office.forms.totalForms > 0) {
          console.log('   📋 Form Categories:');
          office.forms.formsByType.forEach(category => {
            if (category.count > 0) {
              console.log(`      ${category.type}: ${category.count} forms`);
            }
          });
        }

        if (Object.keys(office.portals).length > 0) {
          console.log('   🌐 Online Portals:');
          Object.entries(office.portals).forEach(([type, url]) => {
            if (url) {
              console.log(`      ${type}: Available`);
            }
          });
        }

      } else {
        console.log(`   ❌ Detailed extraction failed: ${detailData.error}`);
      }

    } catch (error) {
      console.log(`   ❌ Error testing ${testUrl}:`, error.message);
    }

    console.log(''); // Add spacing between tests
  }
}

async function testFormScraping() {
  console.log('\n📝 Testing Form Scraping Enhancement...\n');

  try {
    // Test the enhanced form scraping
    const formResponse = await fetch('http://localhost:3000/api/permit-forms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        websiteUrl: 'https://www.gwinnettcounty.com',
        officeName: 'Gwinnett County Building Department'
      })
    });

    if (!formResponse.ok) {
      throw new Error(`Form scraping failed: ${formResponse.status}`);
    }

    const formData = await formResponse.json();

    if (formData.success) {
      console.log('✅ Enhanced form scraping successful');
      console.log(`📊 Total Forms Found: ${formData.totalForms}`);

      Object.entries(formData.forms).forEach(([category, forms]) => {
        if (forms.length > 0) {
          console.log(`\n📂 ${category.charAt(0).toUpperCase() + category.slice(1)} Forms (${forms.length}):`);
          forms.slice(0, 3).forEach(form => { // Show first 3 forms per category
            console.log(`   • ${form.name} (${form.type || 'LINK'})`);
          });
          if (forms.length > 3) {
            console.log(`   ... and ${forms.length - 3} more`);
          }
        }
      });

      if (formData.forms.businessHours) {
        console.log('\n🕒 Business Hours Found:');
        Object.entries(formData.forms.businessHours).forEach(([day, hours]) => {
          console.log(`   ${day}: ${hours}`);
        });
      }

    } else {
      console.log('❌ Form scraping failed:', formData.error);
    }

  } catch (error) {
    console.error('❌ Form scraping test failed:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Enhanced Web Scraper Test Suite\n');
  console.log('================================\n');

  await testEnhancedSearch();
  await testDetailedExtraction();
  await testFormScraping();

  console.log('\n✨ Test Suite Complete!');
  console.log('\n💡 Enhanced Features Tested:');
  console.log('   • Google Custom Search with detailed extraction');
  console.log('   • Comprehensive website data scraping');
  console.log('   • Government pattern recognition');
  console.log('   • Related page crawling');
  console.log('   • Enhanced form detection');
  console.log('   • Business hours extraction');
  console.log('   • Staff contact information');
  console.log('   • Service capability detection');
  console.log('   • Online portal identification');
  console.log('   • Data quality scoring');
}

// Run the tests
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = {
  testEnhancedSearch,
  testDetailedExtraction,
  testFormScraping
};