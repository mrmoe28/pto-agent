'use client';

import { useState } from 'react';
import { MapPin, Phone, Mail, Globe, Clock, FileText, DollarSign, CheckCircle, ExternalLink, Shield, Calendar, RefreshCw, Navigation } from 'lucide-react';

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
    if (!fee.amount) return fee.description || 'Not Applicable';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const formatProcessingTime = (time: { min?: number; max?: number; unit?: string; description?: string }) => {
    if (!time.min && !time.max) return time.description || 'Contact for details';
    if (time.min === time.max) return `${time.min} ${time.unit || 'days'}`;
    return `${time.min}-${time.max} ${time.unit || 'days'}`;
  };

  const renderQuickInfo = () => (
    <div className="space-y-6">
      {/* Primary Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Contact Actions */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <Phone className="h-5 w-5 mr-2 text-green-600" />
            Contact & Visit
          </h4>
          <div className="space-y-3">
            {office.phone && (
              <a href={`tel:${office.phone}`} className="block p-4 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors group">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-green-800 mb-1">Call Office</div>
                    <div className="text-lg font-semibold text-green-900">{office.phone}</div>
                  </div>
                  <Phone className="h-6 w-6 text-green-600 group-hover:scale-110 transition-transform" />
                </div>
              </a>
            )}
            {office.website && (
              <a 
                href={office.website} 
                target="_blank" 
                rel="noopener noreferrer"
                className="block p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-blue-800 mb-1">Visit Website</div>
                    <div className="text-sm text-blue-900 truncate">{office.website}</div>
                  </div>
                  <ExternalLink className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                </div>
              </a>
            )}
            {office.email && (
              <a 
                href={`mailto:${office.email}`} 
                className="block p-4 bg-purple-50 border border-purple-200 rounded-lg hover:bg-purple-100 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-purple-800 mb-1">Send Email</div>
                    <div className="text-sm text-purple-900 truncate">{office.email}</div>
                  </div>
                  <Mail className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                </div>
              </a>
            )}
          </div>
        </div>

        {/* Hours & Location */}
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2 text-orange-600" />
            Hours & Location
          </h4>
          <div className="space-y-3">
            {/* Operating Hours */}
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="text-sm font-medium text-orange-800 mb-2">Operating Hours</div>
              <div className="space-y-1">
                {getOperatingHours().slice(0, 3).map((day, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-orange-700 font-medium">{day.name}:</span>
                    <span className="text-orange-900">{day.hours}</span>
                  </div>
                ))}
                {getOperatingHours().length > 3 && (
                  <div className="text-xs text-orange-600 text-center pt-2 border-t border-orange-200">
                    +{getOperatingHours().length - 3} more days available
                  </div>
                )}
              </div>
            </div>
            
            {/* Address */}
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="text-sm font-medium text-gray-800 mb-1">Office Address</div>
              <div className="text-sm text-gray-700">{office.address}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Services Overview */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center text-lg">
          <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
          Services Available
        </h4>
        
        {/* Available Services */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-3">Permit Services</div>
            <div className="grid grid-cols-1 gap-2">
              {getAvailableServices().map((service, idx) => (
                <div key={idx} className="flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-600 mr-2 flex-shrink-0" />
                  <span className="text-green-800">{service}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Online Services */}
          {getOnlineServices().length > 0 && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-sm font-medium text-blue-800 mb-3">Online Services</div>
              <div className="grid grid-cols-1 gap-2">
                {getOnlineServices().map((service, idx) => (
                  <div key={idx} className="flex items-center text-sm">
                    <Globe className="h-4 w-4 text-blue-600 mr-2 flex-shrink-0" />
                    <span className="text-blue-800">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Fees Preview */}
      {office.permitFees && Object.keys(office.permitFees).length > 0 && (
        <div className="space-y-3">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Sample Fees
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.entries(office.permitFees).slice(0, 6).map(([type, fee]) => {
              if (!fee) return null;
              return (
                <div key={type} className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="text-sm font-medium text-gray-800 capitalize mb-1">{type}</div>
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
    <div className="space-y-6">
      {/* Office Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Contact & Location */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <MapPin className="h-5 w-5 mr-2 text-blue-600" />
            Contact & Location
          </h4>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg space-y-3">
            <div>
              <div className="text-sm font-medium text-blue-800 mb-1">Office Address</div>
              <div className="text-sm text-blue-900">{office.address}</div>
            </div>
            {office.phone && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-800">Phone</div>
                  <a href={`tel:${office.phone}`} className="text-sm text-blue-900 hover:text-blue-700">
                    {office.phone}
                  </a>
                </div>
                <Phone className="h-5 w-5 text-blue-600" />
              </div>
            )}
            {office.email && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-800">Email</div>
                  <a href={`mailto:${office.email}`} className="text-sm text-blue-900 hover:text-blue-700">
                    {office.email}
                  </a>
                </div>
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
            )}
            {office.website && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-blue-800">Website</div>
                  <a 
                    href={office.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-blue-900 hover:text-blue-700 flex items-center"
                  >
                    Visit Website
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </div>
                <Globe className="h-5 w-5 text-blue-600" />
              </div>
            )}
          </div>
        </div>

        {/* Jurisdiction & Coverage */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-green-600" />
            Jurisdiction & Coverage
          </h4>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-green-800">Jurisdiction Type</div>
                <div className="text-sm text-green-900 capitalize">{office.jurisdiction_type}</div>
              </div>
              <Shield className="h-5 w-5 text-green-600" />
            </div>
            {office.serviceAreaBounds && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Service Area</div>
                  <div className="text-sm text-green-900">Defined boundaries</div>
                </div>
                <Navigation className="h-5 w-5 text-green-600" />
              </div>
            )}
            {office.latitude && office.longitude && (
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium text-green-800">Coordinates</div>
                  <div className="text-xs text-green-900 font-mono">{office.latitude}, {office.longitude}</div>
                </div>
                <MapPin className="h-5 w-5 text-green-600" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Operating Hours */}
      {getOperatingHours().length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <Clock className="h-5 w-5 mr-2 text-orange-600" />
            Operating Hours
          </h4>
          <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {getOperatingHours().map((day, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 bg-white rounded border">
                  <span className="text-sm font-medium text-orange-800">{day.name}</span>
                  <span className="text-sm text-orange-900">{day.hours}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Data Quality & Freshness */}
      {(office.dataSource || office.lastVerified || office.crawlFrequency) && (
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <Shield className="h-5 w-5 mr-2 text-gray-600" />
            Data Quality & Freshness
          </h4>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {office.dataSource && (
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Data Source</div>
                    <div className="text-sm text-gray-600 capitalize">{office.dataSource}</div>
                  </div>
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </div>
              )}
              {office.lastVerified && (
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Last Verified</div>
                    <div className="text-sm text-gray-600">{new Date(office.lastVerified).toLocaleDateString()}</div>
                  </div>
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
              )}
              {office.crawlFrequency && (
                <div className="flex items-center justify-between p-3 bg-white rounded border">
                  <div>
                    <div className="text-sm font-medium text-gray-800">Update Frequency</div>
                    <div className="text-sm text-gray-600 capitalize">{office.crawlFrequency}</div>
                  </div>
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </div>
              )}
            </div>
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
    <div className="space-y-6">
      {/* Services Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Services */}
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-900 flex items-center text-lg">
            <CheckCircle className="h-5 w-5 mr-2 text-green-600" />
            Available Services
          </h4>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="grid grid-cols-1 gap-3">
              {getAvailableServices().map((service, idx) => (
                <div key={idx} className="flex items-center p-3 bg-white rounded-lg border border-green-100">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0" />
                  <span className="text-sm font-medium text-green-800">{service}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Online Services */}
        {getOnlineServices().length > 0 && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-900 flex items-center text-lg">
              <Globe className="h-5 w-5 mr-2 text-blue-600" />
              Online Services
            </h4>
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="grid grid-cols-1 gap-3">
                {getOnlineServices().map((service, idx) => (
                  <div key={idx} className="flex items-center p-3 bg-white rounded-lg border border-blue-100">
                    <Globe className="h-5 w-5 text-blue-600 mr-3 flex-shrink-0" />
                    <span className="text-sm font-medium text-blue-800">{service}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Service Categories */}
      <div className="space-y-4">
        <h4 className="font-semibold text-gray-900 flex items-center text-lg">
          <FileText className="h-5 w-5 mr-2 text-purple-600" />
          Service Categories
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Building Permits */}
          {office.building_permits && (
            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-purple-600 mr-2" />
                <span className="font-medium text-purple-800">Building Permits</span>
              </div>
              <p className="text-sm text-purple-700">Construction and renovation permits</p>
            </div>
          )}

          {/* Electrical Permits */}
          {office.electrical_permits && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800">Electrical Permits</span>
              </div>
              <p className="text-sm text-yellow-700">Electrical system installations</p>
            </div>
          )}

          {/* Plumbing Permits */}
          {office.plumbing_permits && (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-blue-600 mr-2" />
                <span className="font-medium text-blue-800">Plumbing Permits</span>
              </div>
              <p className="text-sm text-blue-700">Plumbing system installations</p>
            </div>
          )}

          {/* Mechanical Permits */}
          {office.mechanical_permits && (
            <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-orange-600 mr-2" />
                <span className="font-medium text-orange-800">Mechanical Permits</span>
              </div>
              <p className="text-sm text-orange-700">HVAC and mechanical systems</p>
            </div>
          )}

          {/* Zoning Permits */}
          {office.zoning_permits && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                <span className="font-medium text-green-800">Zoning Permits</span>
              </div>
              <p className="text-sm text-green-700">Land use and zoning approvals</p>
            </div>
          )}

          {/* Planning Review */}
          {office.planning_review && (
            <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-indigo-600 mr-2" />
                <span className="font-medium text-indigo-800">Planning Review</span>
              </div>
              <p className="text-sm text-indigo-700">Development plan reviews</p>
            </div>
          )}

          {/* Inspections */}
          {office.inspections && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-center mb-2">
                <CheckCircle className="h-5 w-5 text-red-600 mr-2" />
                <span className="font-medium text-red-800">Inspections</span>
              </div>
              <p className="text-sm text-red-700">Construction and safety inspections</p>
            </div>
          )}
        </div>
      </div>
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
        {/* Main Office Info */}
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h3 className="text-xl font-semibold text-gray-900 mb-1">
              {office.department_name}
            </h3>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <MapPin className="h-4 w-4 text-gray-400" />
              <span>{office.city}, {office.county} County, {office.state}</span>
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
              <span className="text-lg font-semibold text-blue-600 bg-blue-50 px-3 py-2 rounded-lg">
                {office.distance.toFixed(1)} mi
              </span>
            </div>
          )}
        </div>
        
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center p-3 bg-gray-50 rounded-lg">
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {getAvailableServices().length}
            </div>
            <div className="text-sm text-gray-600 font-medium">Services</div>
          </div>
          <div className="text-center p-3 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600 mb-1">
              {getOnlineServices().length}
            </div>
            <div className="text-sm text-blue-700 font-medium">Online</div>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600 mb-1">
              {getOperatingHours().length}
            </div>
            <div className="text-sm text-green-700 font-medium">Open Days</div>
          </div>
          <div className="text-center p-3 bg-orange-50 rounded-lg">
            <div className="text-2xl font-bold text-orange-600 mb-1">
              {office.permitFees ? Object.keys(office.permitFees).length : 0}
            </div>
            <div className="text-sm text-orange-700 font-medium">Fee Types</div>
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
