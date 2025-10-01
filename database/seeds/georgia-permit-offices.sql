-- Seed data for Georgia permit offices
-- This provides immediate results for common GA locations

-- Lawrenceville, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Lawrenceville', 'Gwinnett', 'GA', 'city', 'Development Services Department', 'combined',
  '70 S Clayton St, Lawrenceville, GA 30046',
  '(770) 963-2414',
  'permits@lawrencevillega.org',
  'https://www.lawrencevillega.org/departments/development-services',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://lawrenceville.viewpointcloud.com',
  '33.9562', '-83.9879', 'manual', true
) ON CONFLICT DO NOTHING;

-- Gwinnett County
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Lawrenceville', 'Gwinnett', 'GA', 'county', 'Planning and Development', 'combined',
  '75 Langley Dr, Lawrenceville, GA 30046',
  '(770) 822-7400',
  'dpd@gwinnettcounty.com',
  'https://www.gwinnettcounty.com/web/gwinnett/departments/planninganddevelopment',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/GWINNETT',
  '33.9562', '-83.9879', 'manual', true
) ON CONFLICT DO NOTHING;

-- Atlanta, GA - City
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Atlanta', 'Fulton', 'GA', 'city', 'Office of Buildings', 'combined',
  '55 Trinity Ave SW Suite 2100, Atlanta, GA 30303',
  '(404) 330-6190',
  'buildings@atlantaga.gov',
  'https://www.atlantaga.gov/government/departments/city-planning/office-of-buildings',
  '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM', '8:00 AM - 4:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/ATLANTA',
  '33.7490', '-84.3880', 'manual', true
) ON CONFLICT DO NOTHING;

-- Fulton County
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Atlanta', 'Fulton', 'GA', 'county', 'Building Permits and Inspections', 'combined',
  '141 Pryor St SW Suite 1001, Atlanta, GA 30303',
  '(404) 612-6180',
  'permits@fultoncountyga.gov',
  'https://www.fultoncountyga.gov/services/building-permits-and-inspections',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/FULTONCOUNTY',
  '33.7490', '-84.3880', 'manual', true
) ON CONFLICT DO NOTHING;

-- Marietta, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Marietta', 'Cobb', 'GA', 'city', 'Development Services', 'combined',
  '205 Lawrence St, Marietta, GA 30060',
  '(770) 794-5450',
  'devservices@mariettaga.gov',
  'https://www.mariettaga.gov/152/Development-Services',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/MARIETTA',
  '33.9526', '-84.5499', 'manual', true
) ON CONFLICT DO NOTHING;

-- Cobb County
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Marietta', 'Cobb', 'GA', 'county', 'Community Development', 'combined',
  '1150 Powder Springs St, Marietta, GA 30064',
  '(770) 528-2030',
  'developmentpermits@cobbcounty.org',
  'https://www.cobbcounty.org/community-development',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/COBBCOUNTY',
  '33.9526', '-84.5499', 'manual', true
) ON CONFLICT DO NOTHING;

-- Alpharetta, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Alpharetta', 'Fulton', 'GA', 'city', 'Community Development', 'combined',
  '2970 Webb Bridge Rd, Alpharetta, GA 30009',
  '(678) 297-6000',
  'planning@alpharetta.ga.us',
  'https://www.alpharetta.ga.us/departments/community-development',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/ALPHARETTA',
  '34.0754', '-84.2941', 'manual', true
) ON CONFLICT DO NOTHING;

-- Roswell, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Roswell', 'Fulton', 'GA', 'city', 'Community Development', 'combined',
  '38 Hill St, Roswell, GA 30075',
  '(770) 594-6080',
  'planning@roswellgov.com',
  'https://www.roswellgov.com/government/departments/community-development',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/ROSWELL',
  '34.0232', '-84.3616', 'manual', true
) ON CONFLICT DO NOTHING;

-- Sandy Springs, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Sandy Springs', 'Fulton', 'GA', 'city', 'Community Development', 'combined',
  '7840 Roswell Rd, Building 500, Sandy Springs, GA 30350',
  '(770) 206-2636',
  'permits@sandyspringsga.gov',
  'https://www.sandyspringsga.gov/government/departments/community-development',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/SANDYSPRINGS',
  '33.9304', '-84.3733', 'manual', true
) ON CONFLICT DO NOTHING;

-- Decatur, GA
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Decatur', 'DeKalb', 'GA', 'city', 'Community Development', 'combined',
  '509 N McDonough St, Decatur, GA 30030',
  '(404) 370-4102',
  'development@decaturga.com',
  'https://www.decaturga.com/community-development',
  '8:30 AM - 5:00 PM', '8:30 AM - 5:00 PM', '8:30 AM - 5:00 PM', '8:30 AM - 5:00 PM', '8:30 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/DECATUR',
  '33.7748', '-84.2963', 'manual', true
) ON CONFLICT DO NOTHING;

-- DeKalb County
INSERT INTO permit_offices (
  city, county, state, jurisdiction_type, department_name, office_type,
  address, phone, email, website,
  hours_monday, hours_tuesday, hours_wednesday, hours_thursday, hours_friday,
  building_permits, electrical_permits, plumbing_permits, mechanical_permits,
  zoning_permits, planning_review, inspections,
  online_applications, online_payments, permit_tracking, online_portal_url,
  latitude, longitude, data_source, active
) VALUES (
  'Decatur', 'DeKalb', 'GA', 'county', 'Planning and Development', 'combined',
  '330 W Ponce de Leon Ave, Decatur, GA 30030',
  '(404) 371-2155',
  'planning@dekalbcountyga.gov',
  'https://www.dekalbcountyga.gov/planning-development',
  '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM', '8:00 AM - 5:00 PM',
  true, true, true, true, true, true, true,
  true, true, true, 'https://aca-prod.accela.com/DEKALBCOUNTY',
  '33.7748', '-84.2963', 'manual', true
) ON CONFLICT DO NOTHING;
