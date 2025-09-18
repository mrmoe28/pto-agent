'use client';

import { ExternalLink, Phone, Mail, MapPin, Clock, FileText, CheckCircle } from 'lucide-react';

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
  // Operating hours
  hours_monday?: string | null;
  hours_tuesday?: string | null;
  hours_wednesday?: string | null;
  hours_thursday?: string | null;
  hours_friday?: string | null;
  hours_saturday?: string | null;
  hours_sunday?: string | null;
  // Services
  building_permits?: boolean;
  electrical_permits?: boolean;
  plumbing_permits?: boolean;
  mechanical_permits?: boolean;
  zoning_permits?: boolean;
  planning_review?: boolean;
  inspections?: boolean;
  // Online services
  online_applications?: boolean;
  online_payments?: boolean;
  permit_tracking?: boolean;
  online_portal_url?: string | null;
  // Enhanced information
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
    requiredDocuments?: string[];
    applicationProcess?: string;
  } | null;
  downloadableApplications?: {
    building?: string[];
    electrical?: string[];
    plumbing?: string[];
    mechanical?: string[];
    zoning?: string[];
    general?: string[];
  } | null;
  processingTimes?: {
    building?: { min?: number; max?: number; unit?: string; description?: string };
    electrical?: { min?: number; max?: number; unit?: string; description?: string };
    plumbing?: { min?: number; max?: number; unit?: string; description?: string };
    mechanical?: { min?: number; max?: number; unit?: string; description?: string };
    zoning?: { min?: number; max?: number; unit?: string; description?: string };
    general?: { min?: number; max?: number; unit?: string; description?: string };
  } | null;
  // Geographic data
  latitude?: string | null;
  longitude?: string | null;
  serviceAreaBounds?: Record<string, unknown> | null;
  // Metadata
  dataSource?: string;
  lastVerified?: string | null;
  crawlFrequency?: string;
  active?: boolean;
  distance?: number;
}

interface PermitOfficeTableProps {
  offices: PermitOffice[];
}

export default function PermitOfficeTable({ offices }: PermitOfficeTableProps) {
  const formatFee = (fee: { amount?: number; description?: string; unit?: string }) => {
    if (!fee.amount) return fee.description || 'Not Applicable';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const getOperatingHours = (office: PermitOffice) => {
    const days = [
      { name: 'Mon', hours: office.hours_monday },
      { name: 'Tue', hours: office.hours_tuesday },
      { name: 'Wed', hours: office.hours_wednesday },
      { name: 'Thu', hours: office.hours_thursday },
      { name: 'Fri', hours: office.hours_friday },
      { name: 'Sat', hours: office.hours_saturday },
      { name: 'Sun', hours: office.hours_sunday },
    ];
    return days.filter(day => day.hours).map(day => `${day.name}: ${day.hours}`).join(', ');
  };

  const getAvailableServices = (office: PermitOffice) => {
    const services = [];
    if (office.building_permits) services.push('Building');
    if (office.electrical_permits) services.push('Electrical');
    if (office.plumbing_permits) services.push('Plumbing');
    if (office.mechanical_permits) services.push('Mechanical');
    if (office.zoning_permits) services.push('Zoning');
    if (office.planning_review) services.push('Planning');
    if (office.inspections) services.push('Inspections');
    return services.join(', ');
  };

  const getOnlineServices = (office: PermitOffice) => {
    const services = [];
    if (office.online_applications) services.push('Applications');
    if (office.online_payments) services.push('Payments');
    if (office.permit_tracking) services.push('Tracking');
    return services.join(', ');
  };

  const getSampleFees = (office: PermitOffice) => {
    if (!office.permitFees) return 'Not Applicable';
    const fees = [];
    if (office.permitFees.building) fees.push(`Building: ${formatFee(office.permitFees.building)}`);
    if (office.permitFees.electrical) fees.push(`Electrical: ${formatFee(office.permitFees.electrical)}`);
    if (office.permitFees.plumbing) fees.push(`Plumbing: ${formatFee(office.permitFees.plumbing)}`);
    if (office.permitFees.general) fees.push(`General: ${formatFee(office.permitFees.general)}`);
    return fees.slice(0, 2).join('; ');
  };

  const getDownloadableApps = (office: PermitOffice) => {
    if (!office.downloadableApplications) return [];
    const apps = [];
    if (office.downloadableApplications.building) apps.push(...office.downloadableApplications.building);
    if (office.downloadableApplications.electrical) apps.push(...office.downloadableApplications.electrical);
    if (office.downloadableApplications.plumbing) apps.push(...office.downloadableApplications.plumbing);
    if (office.downloadableApplications.general) apps.push(...office.downloadableApplications.general);
    return apps.slice(0, 3); // Show max 3 apps
  };

  if (offices.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No permit offices found for this location.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 rounded-lg shadow-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Office Information
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Contact & Hours
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Services
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Online Services
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Sample Fees
            </th>
            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b">
              Applications & Links
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {offices.map((office, index) => (
            <tr key={office.id || index} className="hover:bg-gray-50">
              {/* Office Information */}
              <td className="px-4 py-4 border-b">
                <div className="space-y-2">
                  <div className="font-semibold text-gray-900 text-sm">
                    {office.department_name}
                  </div>
                  <div className="flex items-center text-xs text-gray-600">
                    <MapPin className="h-3 w-3 mr-1" />
                    {office.address}
                  </div>
                  <div className="text-xs text-gray-500">
                    {office.city}, {office.county} County, {office.state}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                      {office.office_type}
                    </span>
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs font-medium">
                      {office.jurisdiction_type}
                    </span>
                    {office.distance && (
                      <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded text-xs font-medium">
                        {office.distance.toFixed(1)} mi
                      </span>
                    )}
                  </div>
                </div>
              </td>

              {/* Contact & Hours */}
              <td className="px-4 py-4 border-b">
                <div className="space-y-2">
                  {office.phone && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Phone className="h-3 w-3 mr-1" />
                      <a href={`tel:${office.phone}`} className="hover:text-blue-600">
                        {office.phone}
                      </a>
                    </div>
                  )}
                  {office.email && (
                    <div className="flex items-center text-xs text-gray-600">
                      <Mail className="h-3 w-3 mr-1" />
                      <a href={`mailto:${office.email}`} className="hover:text-blue-600">
                        {office.email}
                      </a>
                    </div>
                  )}
                  {office.website && (
                    <div className="flex items-center text-xs text-gray-600">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <a 
                        href={office.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="hover:text-blue-600 truncate"
                      >
                        Website
                      </a>
                    </div>
                  )}
                  <div className="flex items-start text-xs text-gray-500">
                    <Clock className="h-3 w-3 mr-1 mt-0.5 flex-shrink-0" />
                    <span className="text-xs">
                      {getOperatingHours(office) || 'Hours not available'}
                    </span>
                  </div>
                </div>
              </td>

              {/* Services */}
              <td className="px-4 py-4 border-b">
                <div className="text-xs text-gray-700">
                  {getAvailableServices(office) || 'Services not specified'}
                </div>
              </td>

              {/* Online Services */}
              <td className="px-4 py-4 border-b">
                <div className="space-y-1">
                  <div className="text-xs text-gray-700">
                    {getOnlineServices(office) || 'None available'}
                  </div>
                  {office.online_portal_url && (
                    <div className="flex items-center text-xs">
                      <ExternalLink className="h-3 w-3 mr-1" />
                      <a 
                        href={office.online_portal_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        Portal
                      </a>
                    </div>
                  )}
                </div>
              </td>

              {/* Sample Fees */}
              <td className="px-4 py-4 border-b">
                <div className="text-xs text-gray-700">
                  {getSampleFees(office)}
                </div>
              </td>

              {/* Applications & Links */}
              <td className="px-4 py-4 border-b">
                <div className="space-y-1">
                  {getDownloadableApps(office).length > 0 ? (
                    getDownloadableApps(office).map((app, appIndex) => (
                      <div key={appIndex} className="flex items-center text-xs">
                        <FileText className="h-3 w-3 mr-1" />
                        <a 
                          href={app} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 truncate"
                        >
                          Application {appIndex + 1}
                        </a>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500">
                      No applications available
                    </div>
                  )}
                  {office.instructions && (
                    <div className="flex items-center text-xs text-gray-600">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      <span>Instructions available</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
