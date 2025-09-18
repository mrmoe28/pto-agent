'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Globe, Clock, FileText, Download, DollarSign, CheckCircle, ExternalLink, Map, Shield, Calendar, RefreshCw, Navigation } from 'lucide-react';

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

interface PermitOfficeCardProps {
  office: PermitOffice;
}

export default function PermitOfficeCard({ office }: PermitOfficeCardProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'overview' | 'services' | 'instructions' | 'fees'>('quick');

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
    if (office.building_permits) services.push('Building Permits');
    if (office.electrical_permits) services.push('Electrical Permits');
    if (office.plumbing_permits) services.push('Plumbing Permits');
    if (office.mechanical_permits) services.push('Mechanical Permits');
    if (office.zoning_permits) services.push('Zoning Permits');
    if (office.planning_review) services.push('Planning Review');
    if (office.inspections) services.push('Inspections');
    return services;
  };

  const getOnlineServices = () => {
    const services = [];
    if (office.online_applications) services.push('Online Applications');
    if (office.online_payments) services.push('Online Payments');
    if (office.permit_tracking) services.push('Permit Tracking');
    return services;
  };

  const formatFee = (fee: { amount?: number; description?: string; unit?: string }) => {
    if (!fee.amount) return fee.description || 'Contact for pricing';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const formatProcessingTime = (time: { min?: number; max?: number; unit?: string; description?: string }) => {
    if (!time.min && !time.max) return time.description || 'Contact for details';
    if (time.min === time.max) return `${time.min} ${time.unit || 'days'}`;
    return `${time.min}-${time.max} ${time.unit || 'days'}`;
  };

  const renderQuickInfo = () => (
    <div className="space-y-4">
      {/* Essential Contact & Hours */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-green-600" />
            Quick Contact
          </h4>
          <div className="space-y-2">
            {office.phone && (
              <a href={`tel:${office.phone}`} className="block p-2 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
                <div className="text-sm font-medium text-green-800">Call Now</div>
                <div className="text-lg font-semibold text-green-900">{office.phone}</div>
              </a>
            )}
            {office.website && (
              <a 
                href={office.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-2 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="text-sm font-medium text-blue-800">Visit Website</div>
                <div className="text-sm text-blue-900 truncate">{office.website}</div>
              </a>
            )}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-orange-600" />
            Today&apos;s Hours
          </h4>
          <div className="space-y-1">
            {getOperatingHours().slice(0, 3).map((day, idx) => (
              <div key={idx} className="flex justify-between text-sm">
                <span className="text-gray-600">{day.name}:</span>
                <span className="text-gray-900 font-medium">{day.hours}</span>
              </div>
            ))}
            {getOperatingHours().length > 3 && (
              <div className="text-xs text-gray-500 text-center pt-1">
                +{getOperatingHours().length - 3} more days
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Key Services */}
      <div className="space-y-3">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Available Services
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {getAvailableServices().map((service, idx) => (
            <div key={idx} className="flex items-center p-2 bg-green-50 rounded-lg">
              <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
              <span className="text-sm text-green-800">{service}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Online Services */}
      {getOnlineServices().length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Globe className="h-4 w-4 mr-2 text-blue-600" />
            Online Services
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {getOnlineServices().map((service, idx) => (
              <div key={idx} className="flex items-center p-2 bg-blue-50 rounded-lg">
                <Globe className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                <span className="text-sm text-blue-800">{service}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Fees Preview */}
      {office.permitFees && Object.keys(office.permitFees).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <DollarSign className="h-4 w-4 mr-2 text-green-600" />
            Sample Fees
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {Object.entries(office.permitFees).slice(0, 4).map(([type, fee]) => {
              if (!fee) return null;
              return (
                <div key={type} className="p-2 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 capitalize">{type}</div>
                  <div className="text-sm text-gray-600">{formatFee(fee)}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderOverview = () => (
    <div className="space-y-4">
      {/* Key Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Information */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-blue-600" />
            Contact Information
          </h4>
          <div className="space-y-2 text-sm">
            <p className="text-gray-700">{office.address}</p>
            {office.phone && (
              <p className="flex items-center text-gray-700">
                <Phone className="h-4 w-4 mr-2 text-green-600" />
                <a href={`tel:${office.phone}`} className="hover:text-blue-600">
                  {office.phone}
                </a>
              </p>
            )}
            {office.email && (
              <p className="flex items-center text-gray-700">
                <Mail className="h-4 w-4 mr-2 text-blue-600" />
                <a href={`mailto:${office.email}`} className="hover:text-blue-600">
                  {office.email}
                </a>
              </p>
            )}
            {office.website && (
              <p className="flex items-center text-gray-700">
                <Globe className="h-4 w-4 mr-2 text-purple-600" />
                <a 
                  href={office.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 flex items-center"
                >
                  Visit Website
                  <ExternalLink className="h-3 w-3 ml-1" />
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Service Area & Coverage */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Map className="h-4 w-4 mr-2 text-green-600" />
            Service Area & Coverage
          </h4>
          <div className="space-y-2 text-sm">
            <div className="flex items-center text-gray-700">
              <Shield className="h-4 w-4 mr-2 text-green-600" />
              <span className="font-medium">Jurisdiction:</span>
              <span className="ml-2 capitalize">{office.jurisdiction_type}</span>
            </div>
            {office.serviceAreaBounds && (
              <div className="flex items-center text-gray-700">
                <Navigation className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Service Area:</span>
                <span className="ml-2">Defined boundaries</span>
              </div>
            )}
            {office.latitude && office.longitude && (
              <div className="flex items-center text-gray-700">
                <MapPin className="h-4 w-4 mr-2 text-red-600" />
                <span className="font-medium">Coordinates:</span>
                <span className="ml-2 text-xs">{office.latitude}, {office.longitude}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Quality & Freshness */}
      {(office.dataSource || office.lastVerified || office.crawlFrequency) && (
        <div className="bg-gray-50 p-3 rounded-lg">
          <h4 className="font-semibold text-gray-900 mb-2 flex items-center">
            <Shield className="h-4 w-4 mr-2 text-gray-600" />
            Data Quality & Freshness
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
            {office.dataSource && (
              <div className="flex items-center text-gray-700">
                <RefreshCw className="h-4 w-4 mr-2 text-blue-600" />
                <span className="font-medium">Source:</span>
                <span className="ml-2 capitalize">{office.dataSource}</span>
              </div>
            )}
            {office.lastVerified && (
              <div className="flex items-center text-gray-700">
                <Calendar className="h-4 w-4 mr-2 text-green-600" />
                <span className="font-medium">Last Verified:</span>
                <span className="ml-2">{new Date(office.lastVerified).toLocaleDateString()}</span>
              </div>
            )}
            {office.crawlFrequency && (
              <div className="flex items-center text-gray-700">
                <RefreshCw className="h-4 w-4 mr-2 text-orange-600" />
                <span className="font-medium">Update Frequency:</span>
                <span className="ml-2 capitalize">{office.crawlFrequency}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Operating Hours */}
      {getOperatingHours().length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Clock className="h-4 w-4 mr-2 text-orange-600" />
            Operating Hours
          </h4>
          <div className="space-y-1 text-sm">
            {getOperatingHours().map((day, idx) => (
              <div key={idx} className="flex justify-between">
                <span className="text-gray-600">{day.name}:</span>
                <span className="text-gray-700">{day.hours}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Available Services */}
      <div className="space-y-2">
        <h4 className="font-semibold text-gray-900 flex items-center">
          <CheckCircle className="h-4 w-4 mr-2 text-green-600" />
          Available Services
        </h4>
        <div className="flex flex-wrap gap-2">
          {getAvailableServices().map((service, idx) => (
            <span key={idx} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
              {service}
            </span>
          ))}
        </div>
      </div>

      {/* Online Services */}
      {getOnlineServices().length > 0 && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900 flex items-center">
            <Globe className="h-4 w-4 mr-2 text-blue-600" />
            Online Services
          </h4>
          <div className="flex flex-wrap gap-2">
            {getOnlineServices().map((service, idx) => (
              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {service}
              </span>
            ))}
          </div>
          {office.online_portal_url && (
            <a 
              href={office.online_portal_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              Access Online Portal
              <ExternalLink className="h-3 w-3 ml-1" />
            </a>
          )}
        </div>
      )}
    </div>
  );

  const renderServices = () => (
    <div className="space-y-4">
      {office.instructions && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Application Instructions</h4>
          {office.instructions.general && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">General Instructions</h5>
              <p className="text-sm text-gray-700">{office.instructions.general}</p>
            </div>
          )}
          {office.instructions.applicationProcess && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <h5 className="font-medium text-gray-800 mb-2">Application Process</h5>
              <p className="text-sm text-gray-700">{office.instructions.applicationProcess}</p>
            </div>
          )}
        </div>
      )}

      {office.instructions?.requiredDocuments && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Required Documents</h4>
          <ul className="space-y-1">
            {office.instructions.requiredDocuments.map((doc, idx) => (
              <li key={idx} className="flex items-start text-sm text-gray-700">
                <FileText className="h-4 w-4 mr-2 text-gray-400 mt-0.5 flex-shrink-0" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {office.downloadableApplications && (
        <div className="space-y-2">
          <h4 className="font-semibold text-gray-900">Downloadable Applications</h4>
          <div className="space-y-2">
            {Object.entries(office.downloadableApplications).map(([type, urls]) => {
              if (!urls || urls.length === 0) return null;
              return (
                <div key={type} className="space-y-1">
                  <h5 className="font-medium text-gray-800 capitalize">{type} Applications</h5>
                  <div className="space-y-1">
                    {urls.map((url, idx) => (
                      <a 
                        key={idx}
                        href={url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="flex items-center text-sm text-blue-600 hover:text-blue-800"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download {type} application
                        <ExternalLink className="h-3 w-3 ml-1" />
                      </a>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  const renderInstructions = () => (
    <div className="space-y-4">
      {office.instructions && (
        <div className="space-y-4">
          {office.instructions.building && (
            <div className="border-l-4 border-green-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Building Permits</h4>
              <p className="text-sm text-gray-700">{office.instructions.building}</p>
            </div>
          )}
          {office.instructions.electrical && (
            <div className="border-l-4 border-yellow-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Electrical Permits</h4>
              <p className="text-sm text-gray-700">{office.instructions.electrical}</p>
            </div>
          )}
          {office.instructions.plumbing && (
            <div className="border-l-4 border-blue-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Plumbing Permits</h4>
              <p className="text-sm text-gray-700">{office.instructions.plumbing}</p>
            </div>
          )}
          {office.instructions.mechanical && (
            <div className="border-l-4 border-purple-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Mechanical Permits</h4>
              <p className="text-sm text-gray-700">{office.instructions.mechanical}</p>
            </div>
          )}
          {office.instructions.zoning && (
            <div className="border-l-4 border-red-500 pl-4">
              <h4 className="font-semibold text-gray-900 mb-2">Zoning Permits</h4>
              <p className="text-sm text-gray-700">{office.instructions.zoning}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderFees = () => (
    <div className="space-y-4">
      {office.permitFees && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Permit Fees</h4>
          <div className="space-y-2">
            {Object.entries(office.permitFees).map(([type, fee]) => {
              if (!fee) return null;
              return (
                <div key={type} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium text-gray-800 capitalize">{type}</span>
                  <span className="text-sm text-gray-700">{formatFee(fee)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {office.processingTimes && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900">Processing Times</h4>
          <div className="space-y-2">
            {Object.entries(office.processingTimes).map(([type, time]) => {
              if (!time) return null;
              return (
                <div key={type} className="flex justify-between items-center p-2 bg-blue-50 rounded">
                  <span className="font-medium text-gray-800 capitalize">{type}</span>
                  <span className="text-sm text-gray-700">{formatProcessingTime(time)}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex justify-between items-start mb-3">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {office.department_name}
            </h3>
            <p className="text-gray-600 mb-2">
              {office.city}, {office.county} County, {office.state}
            </p>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full capitalize">
                {office.office_type}
              </span>
              <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full capitalize">
                {office.jurisdiction_type}
              </span>
              {office.active !== false && (
                <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full">
                  Active
                </span>
              )}
            </div>
          </div>
          {office.distance && (
            <div className="text-right">
              <span className="text-sm text-blue-600 font-medium bg-blue-50 px-3 py-1 rounded-full">
                {office.distance.toFixed(1)} miles away
              </span>
            </div>
          )}
        </div>
        
        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-100">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getAvailableServices().length}
            </div>
            <div className="text-xs text-gray-500">Services</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getOnlineServices().length}
            </div>
            <div className="text-xs text-gray-500">Online</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {getOperatingHours().length}
            </div>
            <div className="text-xs text-gray-500">Open Days</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-900">
              {office.permitFees ? Object.keys(office.permitFees).length : 0}
            </div>
            <div className="text-xs text-gray-500">Fee Types</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-100">
        <nav className="flex space-x-8 px-6">
          {[
            { id: 'quick', label: 'Quick Info', icon: CheckCircle },
            { id: 'overview', label: 'Overview', icon: MapPin },
            { id: 'services', label: 'Services', icon: CheckCircle },
            { id: 'instructions', label: 'Instructions', icon: FileText },
            { id: 'fees', label: 'Fees & Times', icon: DollarSign },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id as 'quick' | 'overview' | 'services' | 'instructions' | 'fees')}
              className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                activeTab === id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-4 w-4 mr-2" />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {activeTab === 'quick' && renderQuickInfo()}
        {activeTab === 'overview' && renderOverview()}
        {activeTab === 'services' && renderServices()}
        {activeTab === 'instructions' && renderInstructions()}
        {activeTab === 'fees' && renderFees()}
      </div>
    </div>
  );
}
