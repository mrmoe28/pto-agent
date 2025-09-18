'use client';

import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Clock, 
  FileText, 
  CheckCircle, 
  ExternalLink, 
  Shield, 
  Building,
  Zap,
  Wrench,
  Settings,
  Map,
  Eye,
  Download
} from 'lucide-react';

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

interface EnhancedPermitOfficeCardProps {
  office: PermitOffice;
}

export default function EnhancedPermitOfficeCard({ office }: EnhancedPermitOfficeCardProps) {
  const formatFee = (fee: { amount?: number; description?: string; unit?: string }) => {
    if (!fee.amount) return fee.description || 'Not Applicable';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const formatProcessingTime = (time: { min?: number; max?: number; unit?: string; description?: string }) => {
    if (!time.min && !time.max) return time.description || 'Contact for details';
    if (time.min === time.max) return `${time.min} ${time.unit || 'days'}`;
    return `${time.min}-${time.max} ${time.unit || 'days'}`;
  };

  const getOperatingHours = () => {
    const days = [
      { name: 'Monday', hours: office.hours_monday },
      { name: 'Tuesday', hours: office.hours_tuesday },
      { name: 'Wednesday', hours: office.hours_wednesday },
      { name: 'Thursday', hours: office.hours_thursday },
      { name: 'Friday', hours: office.hours_friday },
      { name: 'Saturday', hours: office.hours_saturday },
      { name: 'Sunday', hours: office.hours_sunday },
    ];
    return days.filter(day => day.hours);
  };

  const getAvailableServices = () => {
    const services = [];
    if (office.building_permits) services.push({ name: 'Building Permits', icon: Building, color: 'blue' });
    if (office.electrical_permits) services.push({ name: 'Electrical Permits', icon: Zap, color: 'yellow' });
    if (office.plumbing_permits) services.push({ name: 'Plumbing Permits', icon: Wrench, color: 'green' });
    if (office.mechanical_permits) services.push({ name: 'Mechanical Permits', icon: Settings, color: 'purple' });
    if (office.zoning_permits) services.push({ name: 'Zoning Permits', icon: Map, color: 'orange' });
    if (office.planning_review) services.push({ name: 'Planning Review', icon: Eye, color: 'indigo' });
    if (office.inspections) services.push({ name: 'Inspections', icon: CheckCircle, color: 'emerald' });
    return services;
  };

  const getOnlineServices = () => {
    const services = [];
    if (office.online_applications) services.push('Online Applications');
    if (office.online_payments) services.push('Online Payments');
    if (office.permit_tracking) services.push('Permit Tracking');
    return services;
  };

  const getSampleFees = () => {
    if (!office.permitFees) return [];
    const fees = [];
    if (office.permitFees.building) fees.push({ type: 'Building', fee: office.permitFees.building });
    if (office.permitFees.electrical) fees.push({ type: 'Electrical', fee: office.permitFees.electrical });
    if (office.permitFees.plumbing) fees.push({ type: 'Plumbing', fee: office.permitFees.plumbing });
    if (office.permitFees.mechanical) fees.push({ type: 'Mechanical', fee: office.permitFees.mechanical });
    if (office.permitFees.zoning) fees.push({ type: 'Zoning', fee: office.permitFees.zoning });
    return fees;
  };

  const getDownloadableApps = () => {
    if (!office.downloadableApplications) return [];
    const apps = [];
    if (office.downloadableApplications.building) apps.push(...office.downloadableApplications.building.map(url => ({ type: 'Building', url })));
    if (office.downloadableApplications.electrical) apps.push(...office.downloadableApplications.electrical.map(url => ({ type: 'Electrical', url })));
    if (office.downloadableApplications.plumbing) apps.push(...office.downloadableApplications.plumbing.map(url => ({ type: 'Plumbing', url })));
    if (office.downloadableApplications.mechanical) apps.push(...office.downloadableApplications.mechanical.map(url => ({ type: 'Mechanical', url })));
    if (office.downloadableApplications.zoning) apps.push(...office.downloadableApplications.zoning.map(url => ({ type: 'Zoning', url })));
    return apps;
  };

  const services = getAvailableServices();
  const sampleFees = getSampleFees();
  const downloadableApps = getDownloadableApps();
  const operatingHours = getOperatingHours();
  const onlineServices = getOnlineServices();

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              {office.department_name}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mb-3">
              <MapPin className="h-5 w-5 text-gray-400" />
              <span className="text-lg">{office.address}</span>
            </div>
            <div className="text-gray-600 mb-3">
              <span className="text-lg">{office.city}, {office.county} County, {office.state}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                {office.office_type}
              </span>
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium capitalize">
                {office.jurisdiction_type}
              </span>
              {office.active !== false && (
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-sm font-medium">
                  ✓ Active
                </span>
              )}
            </div>
          </div>
          {office.distance && (
            <div className="text-right">
              <div className="text-sm text-gray-500 mb-1">Distance</div>
              <span className="text-xl font-semibold text-blue-600 bg-blue-50 px-4 py-2 rounded-lg">
                {office.distance.toFixed(1)} mi
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Services & Pricing Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Shield className="h-5 w-5 mr-2 text-blue-600" />
          Services & Pricing
        </h4>
        
        {/* Services */}
        <div className="mb-6">
          <h5 className="text-lg font-medium text-gray-800 mb-3">Available Services</h5>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center p-3 rounded-lg bg-${service.color}-50 border border-${service.color}-200`}
                >
                  <Icon className={`w-5 h-5 mr-2 text-${service.color}-600`} />
                  <span className={`text-sm font-medium text-${service.color}-800`}>
                    {service.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fees */}
        <div>
          <h5 className="text-lg font-medium text-gray-800 mb-3">Permit Fees</h5>
          {sampleFees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleFees.map((fee, idx) => (
                <div key={idx} className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-gray-800 capitalize">{fee.type}</span>
                    <span className="text-sm text-gray-700">{formatFee(fee.fee)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
              <span className="text-gray-500">Not Applicable</span>
            </div>
          )}
        </div>
      </div>

      {/* Contact & Hours Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Phone className="h-5 w-5 mr-2 text-green-600" />
          Contact & Hours
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 mb-3">Contact Information</h5>
            <div className="space-y-3">
              {office.phone && (
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-3 text-gray-400" />
                  <a 
                    href={`tel:${office.phone}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {office.phone}
                  </a>
                </div>
              )}
              {office.email && (
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-3 text-gray-400" />
                  <a 
                    href={`mailto:${office.email}`}
                    className="text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {office.email}
                  </a>
                </div>
              )}
              {office.website && (
                <div className="flex items-center">
                  <Globe className="h-4 w-4 mr-3 text-gray-400" />
                  <a 
                    href={office.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-800 hover:underline flex items-center"
                  >
                    Website
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Operating Hours */}
          <div>
            <h5 className="text-lg font-medium text-gray-800 mb-3">Operating Hours</h5>
            {operatingHours.length > 0 ? (
              <div className="space-y-2">
                {operatingHours.map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">{day.name}</span>
                    <span className="text-sm text-gray-600">{day.hours}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-gray-500 text-sm">Hours not available</div>
            )}
          </div>
        </div>
      </div>

      {/* Online Services Card */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
        <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
          <Globe className="h-5 w-5 mr-2 text-purple-600" />
          Online Services
        </h4>
        
        {onlineServices.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {onlineServices.map((service, idx) => (
              <div key={idx} className="flex items-center p-3 bg-purple-50 border border-purple-200 rounded-lg">
                <CheckCircle className="w-5 h-5 mr-2 text-purple-600" />
                <span className="text-sm font-medium text-purple-800">{service}</span>
              </div>
            ))}
            {office.online_portal_url && (
              <div className="md:col-span-3 mt-4">
                <a 
                  href={office.online_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Access Online Portal
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center">
            <span className="text-gray-500">None available</span>
          </div>
        )}
      </div>

      {/* Instructions & Requirements Card */}
      {office.instructions && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2 text-orange-600" />
            Instructions & Requirements
          </h4>
          
          <div className="space-y-6">
            {/* General Instructions */}
            {office.instructions.general && (
              <div>
                <h5 className="text-lg font-medium text-gray-800 mb-2">General Instructions</h5>
                <p className="text-gray-700 leading-relaxed">{office.instructions.general}</p>
              </div>
            )}

            {/* Application Process */}
            {office.instructions.applicationProcess && (
              <div>
                <h5 className="text-lg font-medium text-gray-800 mb-2">Application Process</h5>
                <p className="text-gray-700 leading-relaxed">{office.instructions.applicationProcess}</p>
              </div>
            )}

            {/* Required Documents */}
            {office.instructions.requiredDocuments && office.instructions.requiredDocuments.length > 0 && (
              <div>
                <h5 className="text-lg font-medium text-gray-800 mb-2">Required Documents</h5>
                <ul className="list-disc list-inside space-y-1">
                  {office.instructions.requiredDocuments.map((doc, idx) => (
                    <li key={idx} className="text-gray-700">{doc}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Specific Permit Instructions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {office.instructions.building && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <h6 className="font-medium text-blue-800 mb-2">Building Permits</h6>
                  <p className="text-sm text-blue-700">{office.instructions.building}</p>
                </div>
              )}
              {office.instructions.electrical && (
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h6 className="font-medium text-yellow-800 mb-2">Electrical Permits</h6>
                  <p className="text-sm text-yellow-700">{office.instructions.electrical}</p>
                </div>
              )}
              {office.instructions.plumbing && (
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <h6 className="font-medium text-green-800 mb-2">Plumbing Permits</h6>
                  <p className="text-sm text-green-700">{office.instructions.plumbing}</p>
                </div>
              )}
              {office.instructions.mechanical && (
                <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                  <h6 className="font-medium text-purple-800 mb-2">Mechanical Permits</h6>
                  <p className="text-sm text-purple-700">{office.instructions.mechanical}</p>
                </div>
              )}
              {office.instructions.zoning && (
                <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                  <h6 className="font-medium text-orange-800 mb-2">Zoning Permits</h6>
                  <p className="text-sm text-orange-700">{office.instructions.zoning}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Downloadable Applications Card */}
      {downloadableApps.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Download className="h-5 w-5 mr-2 text-indigo-600" />
            Downloadable Applications
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {downloadableApps.map((app, idx) => (
              <a
                key={idx}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg hover:bg-indigo-100 transition-colors"
              >
                <Download className="w-5 h-5 mr-3 text-indigo-600" />
                <div>
                  <div className="font-medium text-indigo-800">{app.type} Application</div>
                  <div className="text-sm text-indigo-600">Click to download</div>
                </div>
                <ExternalLink className="w-4 h-4 ml-auto text-indigo-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Processing Times Card */}
      {office.processingTimes && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-6">
          <h4 className="text-xl font-semibold text-gray-900 mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2 text-teal-600" />
            Processing Times
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(office.processingTimes).map(([type, time]) => {
              if (!time) return null;
              return (
                <div key={type} className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium text-teal-800 capitalize">{type}</span>
                    <span className="text-sm text-teal-700">{formatProcessingTime(time)}</span>
                  </div>
                  {time.description && (
                    <div className="text-xs text-teal-600 mt-1">{time.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
