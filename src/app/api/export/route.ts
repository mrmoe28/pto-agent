import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { canUserAccessFeature, getUserPlanFromAuth } from '@/lib/subscription-utils';
import ExcelJS from 'exceljs';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: {
      head: string[][];
      body: string[][];
      startY?: number;
      styles?: Record<string, unknown>;
      headStyles?: Record<string, unknown>;
      alternateRowStyles?: Record<string, unknown>;
      margin?: { left: number; right: number };
      tableWidth?: string;
      columnStyles?: Record<number, { cellWidth: number }>;
    }) => jsPDF;
  }
}

interface PermitOffice {
  id?: string;
  city: string;
  county: string;
  state: string;
  jurisdiction_type: string;
  department_name: string;
  office_type: string;
  address: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  hours_monday?: string | null;
  hours_tuesday?: string | null;
  hours_wednesday?: string | null;
  hours_thursday?: string | null;
  hours_friday?: string | null;
  hours_saturday?: string | null;
  hours_sunday?: string | null;
  building_permits?: boolean;
  electrical_permits?: boolean;
  plumbing_permits?: boolean;
  mechanical_permits?: boolean;
  zoning_permits?: boolean;
  planning_review?: boolean;
  inspections?: boolean;
  online_applications?: boolean;
  online_payments?: boolean;
  permit_tracking?: boolean;
  online_portal_url?: string | null;
  permitFees?: {
    building?: { amount?: number; description?: string; unit?: string };
    electrical?: { amount?: number; description?: string; unit?: string };
    plumbing?: { amount?: number; description?: string; unit?: string };
    mechanical?: { amount?: number; description?: string; unit?: string };
    zoning?: { amount?: number; description?: string; unit?: string };
    general?: { amount?: number; description?: string; unit?: string };
  } | null;
  instructions?: {
    general?: string;
    building?: string;
    electrical?: string;
    plumbing?: string;
    mechanical?: string;
    zoning?: string;
  } | null;
}

export async function POST(request: NextRequest) {
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Check if user has Enterprise plan access
  const userPlan = await getUserPlanFromAuth();
  const hasAccess = canUserAccessFeature(userPlan, 'canExportResults');
  if (!hasAccess) {
    return NextResponse.json({
      error: 'Export feature requires Enterprise plan',
      code: 'UPGRADE_REQUIRED'
    }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { format, searchResults, searchQuery } = body as {
      format: 'csv' | 'excel' | 'pdf';
      searchResults: PermitOffice[];
      searchQuery?: string;
    };

    if (!format || !searchResults || !Array.isArray(searchResults)) {
      return NextResponse.json({ 
        error: 'Missing required fields: format, searchResults' 
      }, { status: 400 });
    }

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `permit-offices-${timestamp}`;

    switch (format) {
      case 'csv':
        return exportToCSV(searchResults, filename, searchQuery);
      case 'excel':
        return await exportToExcel(searchResults, filename, searchQuery);
      case 'pdf':
        return exportToPDF(searchResults, filename, searchQuery);
      default:
        return NextResponse.json({
          error: 'Unsupported export format'
        }, { status: 400 });
    }
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ 
      error: 'Failed to export search results' 
    }, { status: 500 });
  }
}

function exportToCSV(data: PermitOffice[], filename: string, searchQuery?: string): NextResponse {
  const headers = [
    'Department Name',
    'City',
    'County',
    'State',
    'Address',
    'Phone',
    'Email',
    'Website',
    'Office Type',
    'Jurisdiction Type',
    'Building Permits',
    'Electrical Permits',
    'Plumbing Permits',
    'Mechanical Permits',
    'Zoning Permits',
    'Planning Review',
    'Inspections',
    'Online Applications',
    'Online Payments',
    'Permit Tracking',
    'Online Portal URL',
    'Hours - Monday',
    'Hours - Tuesday',
    'Hours - Wednesday',
    'Hours - Thursday',
    'Hours - Friday',
    'Hours - Saturday',
    'Hours - Sunday'
  ];

  const csvContent = [
    // Add search query info if provided
    ...(searchQuery ? [`Search Query: ${searchQuery}`, ''] : []),
    headers.join(','),
    ...data.map(office => [
      `"${office.department_name}"`,
      `"${office.city}"`,
      `"${office.county}"`,
      `"${office.state}"`,
      `"${office.address}"`,
      `"${office.phone || ''}"`,
      `"${office.email || ''}"`,
      `"${office.website || ''}"`,
      `"${office.office_type}"`,
      `"${office.jurisdiction_type}"`,
      office.building_permits ? 'Yes' : 'No',
      office.electrical_permits ? 'Yes' : 'No',
      office.plumbing_permits ? 'Yes' : 'No',
      office.mechanical_permits ? 'Yes' : 'No',
      office.zoning_permits ? 'Yes' : 'No',
      office.planning_review ? 'Yes' : 'No',
      office.inspections ? 'Yes' : 'No',
      office.online_applications ? 'Yes' : 'No',
      office.online_payments ? 'Yes' : 'No',
      office.permit_tracking ? 'Yes' : 'No',
      `"${office.online_portal_url || ''}"`,
      `"${office.hours_monday || ''}"`,
      `"${office.hours_tuesday || ''}"`,
      `"${office.hours_wednesday || ''}"`,
      `"${office.hours_thursday || ''}"`,
      `"${office.hours_friday || ''}"`,
      `"${office.hours_saturday || ''}"`,
      `"${office.hours_sunday || ''}"`
    ].join(','))
  ].join('\n');

  return new NextResponse(csvContent, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}.csv"`
    }
  });
}

async function exportToExcel(data: PermitOffice[], filename: string, searchQuery?: string): Promise<NextResponse> {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Permit Offices');

  // Define columns
  worksheet.columns = [
    { header: 'Department Name', key: 'department_name', width: 30 },
    { header: 'City', key: 'city', width: 15 },
    { header: 'County', key: 'county', width: 15 },
    { header: 'State', key: 'state', width: 10 },
    { header: 'Address', key: 'address', width: 35 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Email', key: 'email', width: 25 },
    { header: 'Website', key: 'website', width: 30 },
    { header: 'Office Type', key: 'office_type', width: 20 },
    { header: 'Jurisdiction Type', key: 'jurisdiction_type', width: 20 },
    { header: 'Building Permits', key: 'building_permits', width: 15 },
    { header: 'Electrical Permits', key: 'electrical_permits', width: 15 },
    { header: 'Plumbing Permits', key: 'plumbing_permits', width: 15 },
    { header: 'Mechanical Permits', key: 'mechanical_permits', width: 15 },
    { header: 'Zoning Permits', key: 'zoning_permits', width: 15 },
    { header: 'Planning Review', key: 'planning_review', width: 15 },
    { header: 'Inspections', key: 'inspections', width: 15 },
    { header: 'Online Applications', key: 'online_applications', width: 15 },
    { header: 'Online Payments', key: 'online_payments', width: 15 },
    { header: 'Permit Tracking', key: 'permit_tracking', width: 15 },
    { header: 'Online Portal URL', key: 'online_portal_url', width: 30 },
    { header: 'Hours - Monday', key: 'hours_monday', width: 20 },
    { header: 'Hours - Tuesday', key: 'hours_tuesday', width: 20 },
    { header: 'Hours - Wednesday', key: 'hours_wednesday', width: 20 },
    { header: 'Hours - Thursday', key: 'hours_thursday', width: 20 },
    { header: 'Hours - Friday', key: 'hours_friday', width: 20 },
    { header: 'Hours - Saturday', key: 'hours_saturday', width: 20 },
    { header: 'Hours - Sunday', key: 'hours_sunday', width: 20 }
  ];

  // Add search query info if provided
  if (searchQuery) {
    worksheet.insertRow(1, ['Search Query:', searchQuery]);
    worksheet.insertRow(2, ['']);
  }

  // Add data rows
  data.forEach(office => {
    worksheet.addRow({
      department_name: office.department_name,
      city: office.city,
      county: office.county,
      state: office.state,
      address: office.address,
      phone: office.phone || '',
      email: office.email || '',
      website: office.website || '',
      office_type: office.office_type,
      jurisdiction_type: office.jurisdiction_type,
      building_permits: office.building_permits ? 'Yes' : 'No',
      electrical_permits: office.electrical_permits ? 'Yes' : 'No',
      plumbing_permits: office.plumbing_permits ? 'Yes' : 'No',
      mechanical_permits: office.mechanical_permits ? 'Yes' : 'No',
      zoning_permits: office.zoning_permits ? 'Yes' : 'No',
      planning_review: office.planning_review ? 'Yes' : 'No',
      inspections: office.inspections ? 'Yes' : 'No',
      online_applications: office.online_applications ? 'Yes' : 'No',
      online_payments: office.online_payments ? 'Yes' : 'No',
      permit_tracking: office.permit_tracking ? 'Yes' : 'No',
      online_portal_url: office.online_portal_url || '',
      hours_monday: office.hours_monday || '',
      hours_tuesday: office.hours_tuesday || '',
      hours_wednesday: office.hours_wednesday || '',
      hours_thursday: office.hours_thursday || '',
      hours_friday: office.hours_friday || '',
      hours_saturday: office.hours_saturday || '',
      hours_sunday: office.hours_sunday || ''
    });
  });

  // Style header row
  const headerRow = worksheet.getRow(searchQuery ? 3 : 1);
  headerRow.font = { bold: true };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF3B82F6' }
  };
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };

  // Generate buffer
  const excelBuffer = await workbook.xlsx.writeBuffer();

  return new NextResponse(excelBuffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}.xlsx"`
    }
  });
}

function exportToPDF(data: PermitOffice[], filename: string, searchQuery?: string): NextResponse {
  const doc = new jsPDF('l', 'mm', 'a4'); // landscape orientation for better table display
  
  // Add title
  doc.setFontSize(16);
  doc.text('Permit Offices Search Results', 14, 22);
  
  // Add search query if provided
  if (searchQuery) {
    doc.setFontSize(10);
    doc.text(`Search Query: ${searchQuery}`, 14, 30);
  }
  
  // Add export date
  doc.setFontSize(10);
  doc.text(`Exported on: ${new Date().toLocaleDateString()}`, 14, 35);

  // Prepare table data
  const tableData = data.map(office => [
    office.department_name,
    office.city,
    office.county,
    office.state,
    office.address,
    office.phone || '',
    office.email || '',
    office.website || '',
    office.building_permits ? 'Yes' : 'No',
    office.electrical_permits ? 'Yes' : 'No',
    office.plumbing_permits ? 'Yes' : 'No',
    office.mechanical_permits ? 'Yes' : 'No',
    office.zoning_permits ? 'Yes' : 'No',
    office.online_applications ? 'Yes' : 'No',
    office.online_payments ? 'Yes' : 'No'
  ]);

  const tableHeaders = [
    'Department',
    'City',
    'County',
    'State',
    'Address',
    'Phone',
    'Email',
    'Website',
    'Building',
    'Electrical',
    'Plumbing',
    'Mechanical',
    'Zoning',
    'Online Apps',
    'Online Pay'
  ];

  // Add table
  doc.autoTable({
    head: [tableHeaders],
    body: tableData,
    startY: 40,
    styles: { fontSize: 8 },
    headStyles: { fillColor: [59, 130, 246] }, // blue-500
    alternateRowStyles: { fillColor: [249, 250, 251] }, // gray-50
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
    columnStyles: {
      0: { cellWidth: 25 }, // Department
      1: { cellWidth: 15 }, // City
      2: { cellWidth: 15 }, // County
      3: { cellWidth: 10 }, // State
      4: { cellWidth: 30 }, // Address
      5: { cellWidth: 20 }, // Phone
      6: { cellWidth: 25 }, // Email
      7: { cellWidth: 25 }, // Website
      8: { cellWidth: 12 }, // Building
      9: { cellWidth: 12 }, // Electrical
      10: { cellWidth: 12 }, // Plumbing
      11: { cellWidth: 12 }, // Mechanical
      12: { cellWidth: 12 }, // Zoning
      13: { cellWidth: 12 }, // Online Apps
      14: { cellWidth: 12 }  // Online Pay
    }
  });

  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

  return new NextResponse(pdfBuffer, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}.pdf"`
    }
  });
}
