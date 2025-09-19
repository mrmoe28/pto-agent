const { neon } = require('@neondatabase/serverless');

async function addJonesboroData() {
  try {
    const sql = neon(process.env.DATABASE_URL);
    
    console.log('Adding Jonesboro/Clayton County permit office data...');
    
    // Add Jonesboro city permit office
    const jonesboroOffice = {
      city: 'Jonesboro',
      county: 'Clayton',
      state: 'GA',
      jurisdiction_type: 'city',
      department_name: 'City of Jonesboro - Building & Planning Department',
      office_type: 'combined',
      address: '124 North Avenue, Jonesboro, GA 30236',
      phone: '(770) 478-3800',
      email: 'building@jonesboroga.gov',
      website: 'https://www.jonesboroga.gov',
      hours_monday: '8:00 AM - 5:00 PM',
      hours_tuesday: '8:00 AM - 5:00 PM',
      hours_wednesday: '8:00 AM - 5:00 PM',
      hours_thursday: '8:00 AM - 5:00 PM',
      hours_friday: '8:00 AM - 5:00 PM',
      hours_saturday: null,
      hours_sunday: null,
      building_permits: true,
      electrical_permits: true,
      plumbing_permits: true,
      mechanical_permits: true,
      zoning_permits: true,
      planning_review: true,
      inspections: true,
      online_applications: true,
      online_payments: false,
      permit_tracking: true,
      online_portal_url: 'https://www.jonesboroga.gov/OnlineForms.aspx',
      latitude: 33.5215,
      longitude: -84.3538,
      data_source: 'manual',
      last_verified: new Date().toISOString(),
      crawl_frequency: 'monthly',
      active: true
    };

    // Add Clayton County permit office
    const claytonCountyOffice = {
      city: 'Jonesboro',
      county: 'Clayton',
      state: 'GA',
      jurisdiction_type: 'county',
      department_name: 'Clayton County - Community Development Department',
      office_type: 'combined',
      address: '112 Smith Street, Jonesboro, GA 30236',
      phone: '(770) 477-3500',
      email: 'communitydevelopment@claytoncountyga.gov',
      website: 'https://www.claytoncountyga.gov',
      hours_monday: '8:00 AM - 5:00 PM',
      hours_tuesday: '8:00 AM - 5:00 PM',
      hours_wednesday: '8:00 AM - 5:00 PM',
      hours_thursday: '8:00 AM - 5:00 PM',
      hours_friday: '8:00 AM - 5:00 PM',
      hours_saturday: null,
      hours_sunday: null,
      building_permits: true,
      electrical_permits: true,
      plumbing_permits: true,
      mechanical_permits: true,
      zoning_permits: true,
      planning_review: true,
      inspections: true,
      online_applications: true,
      online_payments: true,
      permit_tracking: true,
      online_portal_url: 'https://www.claytoncountyga.gov/government/community-development/',
      latitude: 33.5215,
      longitude: -84.3538,
      data_source: 'manual',
      last_verified: new Date().toISOString(),
      crawl_frequency: 'monthly',
      active: true
    };

    // Insert the offices
    await sql`
      INSERT INTO permit_offices (
        city, county, state, jurisdiction_type, department_name, office_type,
        address, phone, email, website, hours_monday, hours_tuesday, hours_wednesday,
        hours_thursday, hours_friday, hours_saturday, hours_sunday,
        building_permits, electrical_permits, plumbing_permits, mechanical_permits,
        zoning_permits, planning_review, inspections, online_applications,
        online_payments, permit_tracking, online_portal_url, latitude, longitude,
        data_source, last_verified, crawl_frequency, active
      ) VALUES (
        ${jonesboroOffice.city}, ${jonesboroOffice.county}, ${jonesboroOffice.state},
        ${jonesboroOffice.jurisdiction_type}, ${jonesboroOffice.department_name}, ${jonesboroOffice.office_type},
        ${jonesboroOffice.address}, ${jonesboroOffice.phone}, ${jonesboroOffice.email}, ${jonesboroOffice.website},
        ${jonesboroOffice.hours_monday}, ${jonesboroOffice.hours_tuesday}, ${jonesboroOffice.hours_wednesday},
        ${jonesboroOffice.hours_thursday}, ${jonesboroOffice.hours_friday}, ${jonesboroOffice.hours_saturday}, ${jonesboroOffice.hours_sunday},
        ${jonesboroOffice.building_permits}, ${jonesboroOffice.electrical_permits}, ${jonesboroOffice.plumbing_permits}, ${jonesboroOffice.mechanical_permits},
        ${jonesboroOffice.zoning_permits}, ${jonesboroOffice.planning_review}, ${jonesboroOffice.inspections}, ${jonesboroOffice.online_applications},
        ${jonesboroOffice.online_payments}, ${jonesboroOffice.permit_tracking}, ${jonesboroOffice.online_portal_url}, ${jonesboroOffice.latitude}, ${jonesboroOffice.longitude},
        ${jonesboroOffice.data_source}, ${jonesboroOffice.last_verified}, ${jonesboroOffice.crawl_frequency}, ${jonesboroOffice.active}
      )
    `;

    await sql`
      INSERT INTO permit_offices (
        city, county, state, jurisdiction_type, department_name, office_type,
        address, phone, email, website, hours_monday, hours_tuesday, hours_wednesday,
        hours_thursday, hours_friday, hours_saturday, hours_sunday,
        building_permits, electrical_permits, plumbing_permits, mechanical_permits,
        zoning_permits, planning_review, inspections, online_applications,
        online_payments, permit_tracking, online_portal_url, latitude, longitude,
        data_source, last_verified, crawl_frequency, active
      ) VALUES (
        ${claytonCountyOffice.city}, ${claytonCountyOffice.county}, ${claytonCountyOffice.state},
        ${claytonCountyOffice.jurisdiction_type}, ${claytonCountyOffice.department_name}, ${claytonCountyOffice.office_type},
        ${claytonCountyOffice.address}, ${claytonCountyOffice.phone}, ${claytonCountyOffice.email}, ${claytonCountyOffice.website},
        ${claytonCountyOffice.hours_monday}, ${claytonCountyOffice.hours_tuesday}, ${claytonCountyOffice.hours_wednesday},
        ${claytonCountyOffice.hours_thursday}, ${claytonCountyOffice.hours_friday}, ${claytonCountyOffice.hours_saturday}, ${claytonCountyOffice.hours_sunday},
        ${claytonCountyOffice.building_permits}, ${claytonCountyOffice.electrical_permits}, ${claytonCountyOffice.plumbing_permits}, ${claytonCountyOffice.mechanical_permits},
        ${claytonCountyOffice.zoning_permits}, ${claytonCountyOffice.planning_review}, ${claytonCountyOffice.inspections}, ${claytonCountyOffice.online_applications},
        ${claytonCountyOffice.online_payments}, ${claytonCountyOffice.permit_tracking}, ${claytonCountyOffice.online_portal_url}, ${claytonCountyOffice.latitude}, ${claytonCountyOffice.longitude},
        ${claytonCountyOffice.data_source}, ${claytonCountyOffice.last_verified}, ${claytonCountyOffice.crawl_frequency}, ${claytonCountyOffice.active}
      )
    `;

    console.log('Successfully added Jonesboro/Clayton County permit office data!');
    
    // Verify the data was added
    const count = await sql`SELECT COUNT(*) as count FROM permit_offices WHERE city = 'Jonesboro' AND county = 'Clayton'`;
    console.log('Total Jonesboro/Clayton offices now in database:', count[0].count);

  } catch (error) {
    console.error('Error adding data:', error);
  }
}

addJonesboroData();
