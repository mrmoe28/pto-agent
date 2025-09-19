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
  Download,
  Award,
  Users,
  TrendingUp
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
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Header Card */}
      <div className="bg-gradient-to-br from-white via-blue-50/30 to-indigo-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-100/20 to-indigo-100/20 rounded-full -translate-y-16 translate-x-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-green-100/20 to-emerald-100/20 rounded-full translate-y-12 -translate-x-12"></div>
        <div className="flex justify-between items-start mb-6 relative z-10">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                {office.department_name}
              </h3>
            </div>
            <div className="flex items-center gap-3 text-gray-600 mb-4">
              <div className="p-1.5 bg-gray-100 rounded-lg">
                <MapPin className="h-5 w-5 text-gray-500" />
              </div>
              <span className="text-xl font-medium">{office.address}</span>
            </div>
            <div className="text-gray-600 mb-4">
              <span className="text-xl font-medium bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                {office.city}, {office.county} County, {office.state}
              </span>
            </div>
            <div className="flex flex-wrap gap-3">
              <span className="px-4 py-2 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-sm font-semibold capitalize shadow-sm">
                {office.office_type}
              </span>
              <span className="px-4 py-2 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-sm font-semibold capitalize shadow-sm">
                {office.jurisdiction_type}
              </span>
              {office.active !== false && (
                <span className="px-4 py-2 bg-gradient-to-r from-emerald-100 to-emerald-200 text-emerald-800 rounded-full text-sm font-semibold shadow-sm flex items-center gap-1">
                  <CheckCircle className="h-4 w-4" />
                  Active
                </span>
              )}
            </div>
          </div>
          {office.distance && (
            <div className="text-right relative z-10">
              <div className="text-sm text-gray-500 mb-2 font-medium">Distance</div>
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 text-white px-6 py-3 rounded-xl shadow-lg">
                <div className="flex items-center gap-2">
                  <Map className="h-5 w-5" />
                  <span className="text-xl font-bold">{office.distance.toFixed(1)} mi</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Services & Pricing Card */}
      <div className="bg-gradient-to-br from-white via-green-50/30 to-emerald-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-24 h-24 bg-gradient-to-br from-green-100/20 to-emerald-100/20 rounded-full -translate-y-12 -translate-x-12"></div>
        <div className="absolute bottom-0 right-0 w-32 h-32 bg-gradient-to-tl from-blue-100/20 to-indigo-100/20 rounded-full translate-y-16 translate-x-16"></div>
        
        <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
          <div className="p-2 bg-green-100 rounded-lg mr-3">
            <Shield className="h-6 w-6 text-green-600" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Services & Pricing
          </span>
        </h4>
        
        {/* Services */}
        <div className="mb-8 relative z-10">
          <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-green-600" />
            Available Services
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {services.map((service, idx) => {
              const Icon = service.icon;
              return (
                <div
                  key={idx}
                  className={`flex items-center p-4 rounded-xl bg-gradient-to-br from-${service.color}-50 to-${service.color}-100 border border-${service.color}-200 shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105`}
                >
                  <div className={`p-2 bg-${service.color}-100 rounded-lg mr-3`}>
                    <Icon className={`w-5 h-5 text-${service.color}-600`} />
                  </div>
                  <span className={`text-sm font-semibold text-${service.color}-800`}>
                    {service.name}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Fees */}
        <div className="relative z-10">
          <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-600" />
            Permit Fees
          </h5>
          {sampleFees.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sampleFees.map((fee, idx) => (
                <div key={idx} className="p-4 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-gray-800 capitalize">{fee.type}</span>
                    <span className="text-sm text-gray-700 font-medium">{formatFee(fee.fee)}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-xl text-center shadow-sm">
              <div className="flex items-center justify-center gap-2">
                <FileText className="h-5 w-5 text-gray-400" />
                <span className="text-gray-500 font-medium">Not Applicable</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Contact & Hours Card */}
      <div className="bg-gradient-to-br from-white via-purple-50/30 to-pink-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-purple-100/20 to-pink-100/20 rounded-full -translate-y-14 translate-x-14"></div>
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-gradient-to-tr from-green-100/20 to-emerald-100/20 rounded-full translate-y-10 -translate-x-10"></div>
        
        <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
          <div className="p-2 bg-purple-100 rounded-lg mr-3">
            <Phone className="h-6 w-6 text-purple-600" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Contact & Hours
          </span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
          {/* Contact Information */}
          <div>
            <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Contact Information
            </h5>
            <div className="space-y-4">
              {office.phone && (
                <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200 hover:shadow-md transition-all duration-200">
                  <div className="p-2 bg-blue-100 rounded-lg mr-3">
                    <Phone className="h-4 w-4 text-blue-600" />
                  </div>
                  <a 
                    href={`tel:${office.phone}`}
                    className="text-blue-700 hover:text-blue-900 font-semibold hover:underline"
                  >
                    {office.phone}
                  </a>
                </div>
              )}
              {office.email && (
                <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-green-100 rounded-xl border border-green-200 hover:shadow-md transition-all duration-200">
                  <div className="p-2 bg-green-100 rounded-lg mr-3">
                    <Mail className="h-4 w-4 text-green-600" />
                  </div>
                  <a 
                    href={`mailto:${office.email}`}
                    className="text-green-700 hover:text-green-900 font-semibold hover:underline"
                  >
                    {office.email}
                  </a>
                </div>
              )}
              {office.website && (
                <div className="flex items-center p-3 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl border border-purple-200 hover:shadow-md transition-all duration-200">
                  <div className="p-2 bg-purple-100 rounded-lg mr-3">
                    <Globe className="h-4 w-4 text-purple-600" />
                  </div>
                  <a 
                    href={office.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-700 hover:text-purple-900 font-semibold hover:underline flex items-center"
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
            <h5 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-purple-600" />
              Operating Hours
            </h5>
            {operatingHours.length > 0 ? (
              <div className="space-y-3">
                {operatingHours.map((day, idx) => (
                  <div key={idx} className="flex justify-between items-center p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 hover:shadow-sm transition-all duration-200">
                    <span className="text-sm font-semibold text-gray-700">{day.name}</span>
                    <span className="text-sm text-gray-600 font-medium">{day.hours}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 text-center">
                <div className="flex items-center justify-center gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500 text-sm font-medium">Hours not available</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Online Services Card */}
      <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-100/20 to-blue-100/20 rounded-full -translate-y-16 -translate-x-16"></div>
        <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-100/20 to-pink-100/20 rounded-full translate-y-12 translate-x-12"></div>
        
        <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
          <div className="p-2 bg-indigo-100 rounded-lg mr-3">
            <Globe className="h-6 w-6 text-indigo-600" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Online Services
          </span>
        </h4>
        
        {onlineServices.length > 0 ? (
          <div className="relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {onlineServices.map((service, idx) => (
                <div key={idx} className="flex items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                    <CheckCircle className="w-5 h-5 text-indigo-600" />
                  </div>
                  <span className="text-sm font-semibold text-indigo-800">{service}</span>
                </div>
              ))}
            </div>
            {office.online_portal_url && (
              <div className="text-center">
                <a 
                  href={office.online_portal_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  <ExternalLink className="h-5 w-5 mr-2" />
                  <span className="font-semibold">Access Online Portal</span>
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border border-gray-200 relative z-10">
            <div className="flex items-center justify-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              <span className="font-medium">None available</span>
            </div>
          </div>
        )}
      </div>

      {/* Instructions & Requirements Card */}
      {office.instructions && (
        <div className="bg-gradient-to-br from-white via-orange-50/30 to-yellow-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-orange-100/20 to-yellow-100/20 rounded-full -translate-y-14 translate-x-14"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-red-100/20 to-pink-100/20 rounded-full translate-y-12 -translate-x-12"></div>
          
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
            <div className="p-2 bg-orange-100 rounded-lg mr-3">
              <FileText className="h-6 w-6 text-orange-600" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Instructions & Requirements
            </span>
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
        <div className="bg-gradient-to-br from-white via-indigo-50/30 to-blue-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-br from-indigo-100/20 to-blue-100/20 rounded-full -translate-y-16 -translate-x-16"></div>
          <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-tl from-purple-100/20 to-pink-100/20 rounded-full translate-y-12 translate-x-12"></div>
          
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
            <div className="p-2 bg-indigo-100 rounded-lg mr-3">
              <Download className="h-6 w-6 text-indigo-600" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Downloadable Applications
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {downloadableApps.map((app, idx) => (
              <a
                key={idx}
                href={app.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 rounded-xl hover:from-indigo-100 hover:to-indigo-200 transition-all duration-200 shadow-sm hover:shadow-md hover:scale-105"
              >
                <div className="p-2 bg-indigo-100 rounded-lg mr-3">
                  <Download className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-indigo-800">{app.type} Application</div>
                  <div className="text-sm text-indigo-600 font-medium">Click to download</div>
                </div>
                <ExternalLink className="w-4 h-4 text-indigo-600" />
              </a>
            ))}
          </div>
        </div>
      )}

      {/* Processing Times Card */}
      {office.processingTimes && (
        <div className="bg-gradient-to-br from-white via-teal-50/30 to-emerald-50/50 rounded-2xl shadow-xl border border-gray-100 p-8 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-28 h-28 bg-gradient-to-bl from-teal-100/20 to-emerald-100/20 rounded-full -translate-y-14 translate-x-14"></div>
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-blue-100/20 to-cyan-100/20 rounded-full translate-y-12 -translate-x-12"></div>
          
          <h4 className="text-2xl font-bold text-gray-900 mb-6 flex items-center relative z-10">
            <div className="p-2 bg-teal-100 rounded-lg mr-3">
              <Clock className="h-6 w-6 text-teal-600" />
            </div>
            <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Processing Times
            </span>
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
            {Object.entries(office.processingTimes).map(([type, time]) => {
              if (!time) return null;
              return (
                <div key={type} className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 border border-teal-200 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 hover:scale-105">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold text-teal-800 capitalize">{type}</span>
                    <span className="text-sm text-teal-700 font-medium">{formatProcessingTime(time)}</span>
                  </div>
                  {time.description && (
                    <div className="text-xs text-teal-600 mt-2 font-medium">{time.description}</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Data Source & Verification Info */}
      <div className="bg-gradient-to-br from-white via-gray-50/30 to-slate-50/50 rounded-2xl shadow-xl border border-gray-100 p-6 relative overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-gray-100/20 to-slate-100/20 rounded-full -translate-y-10 translate-x-10"></div>
        <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-tr from-blue-100/20 to-indigo-100/20 rounded-full translate-y-8 -translate-x-8"></div>
        
        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center relative z-10">
          <div className="p-1.5 bg-gray-100 rounded-lg mr-3">
            <Eye className="h-4 w-4 text-gray-600" />
          </div>
          <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Data Information
          </span>
        </h4>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
          {/* Data Source */}
          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Source</span>
            </div>
            <span className="text-sm font-medium text-gray-800 capitalize">
              {office.dataSource || 'Unknown'}
            </span>
          </div>

          {/* Last Verified */}
          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Last Updated</span>
            </div>
            <span className="text-sm font-medium text-gray-800">
              {office.lastVerified ? new Date(office.lastVerified).toLocaleDateString() : 'Unknown'}
            </span>
          </div>

          {/* Update Frequency */}
          <div className="p-3 bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200 rounded-lg shadow-sm">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Update Frequency</span>
            </div>
            <span className="text-sm font-medium text-gray-800 capitalize">
              {office.crawlFrequency || 'Unknown'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
