-- Solar/Electrical Permit Data Updates for Georgia
-- Add detailed solar permit instructions and timelines

-- Update Lawrenceville with solar permit details
UPDATE permit_offices SET
  instructions = jsonb_build_object(
    'general', 'Solar panel installation requires an electrical permit. Submit plans to the Development Services Department.',
    'electrical', 'For solar installations: 1) Submit site plan showing panel locations 2) Provide electrical diagrams 3) Include product specifications 4) Submit structural calculations for roof-mounted systems 5) Schedule inspection after installation',
    'requiredDocuments', ARRAY[
      'Completed electrical permit application',
      'Site plan showing solar panel layout',
      'Single-line electrical diagram',
      'Equipment specifications and certifications',
      'Structural calculations (for roof-mounted systems)',
      'Utility interconnection agreement',
      'Homeowner association approval (if applicable)'
    ],
    'applicationProcess', 'Submit application online or in person. Plans will be reviewed within 5-10 business days. Upon approval, install system and schedule final inspection.'
  ),
  processing_times = jsonb_build_object(
    'electrical', jsonb_build_object(
      'min', 5,
      'max', 10,
      'unit', 'business days',
      'description', 'Plan review typically takes 5-10 business days. Expedited review available for additional fee. Inspection scheduled within 48 hours of request.'
    )
  ),
  permit_fees = jsonb_build_object(
    'electrical', jsonb_build_object(
      'amount', 150,
      'description', 'Base electrical permit fee $150, plus $25 per kW of system capacity. Inspection fees included.',
      'unit', 'USD'
    )
  )
WHERE city = 'Lawrenceville' AND jurisdiction_type = 'city';

-- Update Gwinnett County with solar permit details
UPDATE permit_offices SET
  instructions = jsonb_build_object(
    'general', 'Gwinnett County requires electrical and building permits for solar installations.',
    'electrical', 'Solar PV systems require: 1) Electrical permit application 2) Code-compliant electrical plans 3) Manufacturer specifications 4) Interconnection application with utility 5) Two inspections: rough-in and final',
    'requiredDocuments', ARRAY[
      'Building permit application',
      'Electrical permit application',
      'Engineered drawings and calculations',
      'Panel specifications and certifications',
      'Roof layout and mounting details',
      'Georgia Power interconnection application',
      'Insurance certificate of installer'
    ],
    'applicationProcess', 'Apply online through Accela portal. Upload all required documents. Review time is 7-14 business days. Schedule inspections through online portal.'
  ),
  processing_times = jsonb_build_object(
    'electrical', jsonb_build_object(
      'min', 7,
      'max', 14,
      'unit', 'business days',
      'description', 'Standard review: 7-14 business days. Express review (3-5 days) available for 50% surcharge.'
    )
  ),
  permit_fees = jsonb_build_object(
    'electrical', jsonb_build_object(
      'amount', 200,
      'description', 'Electrical permit: $200 base + $30 per kW. Building permit: $175. Total varies by system size.',
      'unit', 'USD'
    )
  )
WHERE county = 'Gwinnett' AND jurisdiction_type = 'county';

-- Update Atlanta with solar permit details
UPDATE permit_offices SET
  instructions = jsonb_build_object(
    'general', 'City of Atlanta expedited solar permitting program available for residential systems up to 25kW.',
    'electrical', 'Atlanta Solar Permit Requirements: 1) Complete online application 2) Upload pre-approved plans (if using certified installer) 3) Submit electrical and structural documents 4) Pay fees online 5) Receive same-day or next-day approval for qualifying systems',
    'requiredDocuments', ARRAY[
      'Online permit application',
      'Electrical single-line diagram',
      'Roof plan with panel layout',
      'Racking system specifications',
      'Georgia Power interconnection form',
      'Contractor license verification',
      'Photo documentation of existing roof condition'
    ],
    'applicationProcess', 'Apply through Atlanta Accela portal. Standard review: 10 business days. Expedited review (1-2 days) for certified solar installers using pre-approved equipment.'
  ),
  processing_times = jsonb_build_object(
    'electrical', jsonb_build_object(
      'min', 1,
      'max', 10,
      'unit', 'business days',
      'description', 'Expedited review: 1-2 business days for qualifying systems. Standard review: 7-10 business days.'
    )
  ),
  permit_fees = jsonb_build_object(
    'electrical', jsonb_build_object(
      'amount', 175,
      'description', 'Residential solar: $175 flat fee (up to 25kW). Commercial: $250 base + $40/kW.',
      'unit', 'USD'
    )
  )
WHERE city = 'Atlanta' AND jurisdiction_type = 'city';

-- Update Fulton County with solar details
UPDATE permit_offices SET
  instructions = jsonb_build_object(
    'general', 'Fulton County participates in SolSmart program for streamlined solar permitting.',
    'electrical', 'Solar Installation Process: 1) Verify property is in unincorporated Fulton County 2) Submit combined building/electrical permit 3) Include structural and electrical calculations 4) Obtain utility approval 5) Complete installation and inspections',
    'requiredDocuments', ARRAY[
      'Combined permit application form',
      'Professional engineer stamped plans',
      'Equipment cut sheets and certifications',
      'Homeowner affidavit (residential)',
      'Georgia Power service agreement',
      'Roof inspection report (for existing structures)',
      'Site survey and photos'
    ],
    'applicationProcess', 'Submit online via Accela system. Include all documents in initial submission to avoid delays. Plan review in 10-15 business days.'
  ),
  processing_times = jsonb_build_object(
    'electrical', jsonb_build_object(
      'min', 10,
      'max', 15,
      'unit', 'business days',
      'description', 'Review period: 10-15 business days. Resubmittals add 5-7 days. Inspection scheduling within 3 business days.'
    )
  ),
  permit_fees = jsonb_build_object(
    'electrical', jsonb_build_object(
      'amount', 225,
      'description', 'Combined permit fee: $225 base + $35 per kW of DC capacity. Includes plan review and inspections.',
      'unit', 'USD'
    )
  )
WHERE county = 'Fulton' AND jurisdiction_type = 'county';

-- Update Marietta with solar details
UPDATE permit_offices SET
  instructions = jsonb_build_object(
    'general', 'Marietta requires electrical permit for all solar PV installations. Fast-track available for residential.',
    'electrical', 'Solar Permit Steps: 1) Complete application with installer information 2) Submit engineered plans 3) Provide equipment documentation 4) Pay permit fees 5) Schedule rough and final inspections',
    'requiredDocuments', ARRAY[
      'Electrical permit application',
      'Signed and sealed engineering plans',
      'Solar panel spec sheets',
      'Inverter specifications',
      'Mounting system details',
      'Electrical load calculations',
      'Contractor license and insurance'
    ],
    'applicationProcess', 'Apply in person or online. Residential fast-track (3-5 days) for systems under 10kW with certified installers. Commercial systems: 10-14 day review.'
  ),
  processing_times = jsonb_build_object(
    'electrical', jsonb_build_object(
      'min', 3,
      'max', 14,
      'unit', 'business days',
      'description', 'Fast-track residential: 3-5 days. Standard residential: 7-10 days. Commercial: 10-14 days.'
    )
  ),
  permit_fees = jsonb_build_object(
    'electrical', jsonb_build_object(
      'amount', 165,
      'description', 'Residential under 10kW: $165 flat. Over 10kW: $200 + $30/kW. Includes all inspections.',
      'unit', 'USD'
    )
  )
WHERE city = 'Marietta' AND jurisdiction_type = 'city';

-- Add solar-specific flags
UPDATE permit_offices SET
  electrical_permits = true,
  online_applications = true
WHERE state = 'GA' AND (
  city IN ('Lawrenceville', 'Atlanta', 'Marietta', 'Alpharetta', 'Roswell', 'Sandy Springs', 'Decatur') OR
  county IN ('Gwinnett', 'Fulton', 'Cobb', 'DeKalb')
);
