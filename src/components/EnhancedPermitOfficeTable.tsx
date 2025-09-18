'use client';

import React, { useState } from 'react';
import { 
  ExternalLink, Phone, Mail, MapPin, Clock, FileText, 
  CheckCircle, ChevronDown, ChevronUp, Search,
  Download, Building, Zap, Droplets, Settings
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

interface EnhancedPermitOfficeTableProps {
  offices: PermitOffice[];
}

export default function EnhancedPermitOfficeTable({ offices }: EnhancedPermitOfficeTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('distance');

  const formatFee = (fee: { amount?: number; description?: string; unit?: string }) => {
    if (!fee.amount) return fee.description || 'Not Applicable';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const formatProcessingTime = (time: { min?: number; max?: number; unit?: string; description?: string }) => {
    if (!time.min) return time.description || 'Contact for timing';
    const unit = time.unit || 'days';
    if (time.max && time.max !== time.min) {
      return `${time.min}-${time.max} ${unit}`;
    }
    return `${time.min} ${unit}`;
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
    return days.filter(day => day.hours);
  };

  const getAvailableServices = (office: PermitOffice) => {
    const services = [];
    if (office.building_permits) services.push({ name: 'Building', icon: Building, color: 'blue' });
    if (office.electrical_permits) services.push({ name: 'Electrical', icon: Zap, color: 'yellow' });
    if (office.plumbing_permits) services.push({ name: 'Plumbing', icon: Droplets, color: 'cyan' });
    if (office.mechanical_permits) services.push({ name: 'Mechanical', icon: Settings, color: 'purple' });
    if (office.zoning_permits) services.push({ name: 'Zoning', icon: MapPin, color: 'green' });
    if (office.planning_review) services.push({ name: 'Planning', icon: FileText, color: 'indigo' });
    if (office.inspections) services.push({ name: 'Inspections', icon: CheckCircle, color: 'orange' });
    return services;
  };

  const getOnlineServices = (office: PermitOffice) => {
    const services = [];
    if (office.online_applications) services.push('Applications');
    if (office.online_payments) services.push('Payments');
    if (office.permit_tracking) services.push('Tracking');
    return services;
  };

  const getSampleFees = (office: PermitOffice) => {
    if (!office.permitFees) return [];
    const fees = [];
    if (office.permitFees.building) fees.push({ type: 'Building', fee: office.permitFees.building });
    if (office.permitFees.electrical) fees.push({ type: 'Electrical', fee: office.permitFees.electrical });
    if (office.permitFees.plumbing) fees.push({ type: 'Plumbing', fee: office.permitFees.plumbing });
    if (office.permitFees.mechanical) fees.push({ type: 'Mechanical', fee: office.permitFees.mechanical });
    if (office.permitFees.zoning) fees.push({ type: 'Zoning', fee: office.permitFees.zoning });
    if (office.permitFees.general) fees.push({ type: 'General', fee: office.permitFees.general });
    return fees.slice(0, 3);
  };

  const getDownloadableApps = (office: PermitOffice) => {
    if (!office.downloadableApplications) return [];
    const apps = [];
    if (office.downloadableApplications.building) apps.push(...office.downloadableApplications.building);
    if (office.downloadableApplications.electrical) apps.push(...office.downloadableApplications.electrical);
    if (office.downloadableApplications.plumbing) apps.push(...office.downloadableApplications.plumbing);
    if (office.downloadableApplications.general) apps.push(...office.downloadableApplications.general);
    return apps.slice(0, 3);
  };

  const toggleRowExpansion = (officeId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(officeId)) {
      newExpanded.delete(officeId);
    } else {
      newExpanded.add(officeId);
    }
    setExpandedRows(newExpanded);
  };

  const filteredOffices = offices.filter(office => {
    const matchesSearch = searchTerm === '' || 
      office.department_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
      office.county.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterType === 'all' || 
      (filterType === 'online' && (office.online_applications || office.online_payments)) ||
      (filterType === 'building' && office.building_permits) ||
      (filterType === 'electrical' && office.electrical_permits) ||
      (filterType === 'plumbing' && office.plumbing_permits);
    
    return matchesSearch && matchesFilter;
  });

  const sortedOffices = [...filteredOffices].sort((a, b) => {
    if (sortBy === 'distance') {
      return (a.distance || 999) - (b.distance || 999);
    } else if (sortBy === 'name') {
      return a.department_name.localeCompare(b.department_name);
    } else if (sortBy === 'city') {
      return a.city.localeCompare(b.city);
    }
    return 0;
  });

  if (offices.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
          <Building className="w-12 h-12 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No permit offices found</h3>
        <p className="text-gray-500">Try adjusting your search criteria or location.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Search and Filters */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Permit Offices
            </h2>
            <p className="text-gray-600">
              Found {filteredOffices.length} office{filteredOffices.length !== 1 ? 's' : ''} 
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search offices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 w-full sm:w-64"
              />
            </div>
            
            {/* Filter */}
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Services</option>
              <option value="online">Online Services</option>
              <option value="building">Building Permits</option>
              <option value="electrical">Electrical Permits</option>
              <option value="plumbing">Plumbing Permits</option>
            </select>
            
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="distance">Sort by Distance</option>
              <option value="name">Sort by Name</option>
              <option value="city">Sort by City</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Office Information
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Services & Pricing
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact & Hours
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Online Services
                </th>
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedOffices.map((office, index) => {
                const isExpanded = expandedRows.has(office.id || index.toString());
                const services = getAvailableServices(office);
                const sampleFees = getSampleFees(office);
                const operatingHours = getOperatingHours(office);
                const onlineServices = getOnlineServices(office);
                const downloadableApps = getDownloadableApps(office);
                
                return (
                  <React.Fragment key={office.id || index}>
                    {/* Main Row */}
                    <tr className="hover:bg-gray-50 transition-colors duration-200">
                      {/* Office Information */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-1">
                              {office.department_name}
                            </h3>
                            <div className="flex items-center text-sm text-gray-600 mb-2">
                              <MapPin className="h-4 w-4 mr-1" />
                              {office.address}
                            </div>
                            <div className="text-sm text-gray-500">
                              {office.city}, {office.county} County, {office.state}
                            </div>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium capitalize">
                              {office.office_type}
                            </span>
                            <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium capitalize">
                              {office.jurisdiction_type}
                            </span>
                            {office.distance && (
                              <span className="px-3 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">
                                {office.distance.toFixed(1)} mi
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Services & Pricing */}
                      <td className="px-6 py-4">
                        <div className="space-y-3">
                          {/* Services */}
                          <div>
                            <div className="flex flex-wrap gap-1 mb-2">
                              {services.map((service, idx) => {
                                const Icon = service.icon;
                                return (
                                  <span
                                    key={idx}
                                    className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-${service.color}-100 text-${service.color}-800`}
                                  >
                                    <Icon className="w-3 h-3 mr-1" />
                                    {service.name}
                                  </span>
                                );
                              })}
                            </div>
                          </div>
                          
                          {/* Sample Fees */}
                          <div>
                            <div className="text-xs font-medium text-gray-700 mb-1">Sample Fees:</div>
                            <div className="space-y-1">
                              {sampleFees.length > 0 ? (
                                sampleFees.map((fee, idx) => (
                                  <div key={idx} className="text-xs text-gray-600">
                                    <span className="font-medium">{fee.type}:</span> {formatFee(fee.fee)}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs text-gray-500">Not Applicable</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Contact & Hours */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          {office.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="h-4 w-4 mr-2" />
                              <a href={`tel:${office.phone}`} className="hover:text-blue-600">
                                {office.phone}
                              </a>
                            </div>
                          )}
                          {office.email && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="h-4 w-4 mr-2" />
                              <a href={`mailto:${office.email}`} className="hover:text-blue-600">
                                {office.email}
                              </a>
                            </div>
                          )}
                          {office.website && (
                            <div className="flex items-center text-sm text-gray-600">
                              <ExternalLink className="h-4 w-4 mr-2" />
                              <a 
                                href={office.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="hover:text-blue-600"
                              >
                                Website
                              </a>
                            </div>
                          )}
                          <div className="flex items-start text-sm text-gray-500">
                            <Clock className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                            <div>
                              {operatingHours.length > 0 ? (
                                operatingHours.map((day, idx) => (
                                  <div key={idx} className="text-xs">
                                    {day.name}: {day.hours}
                                  </div>
                                ))
                              ) : (
                                <div className="text-xs">Hours not available</div>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Online Services */}
                      <td className="px-6 py-4">
                        <div className="space-y-2">
                          <div className="flex flex-wrap gap-1">
                            {onlineServices.length > 0 ? (
                              onlineServices.map((service, idx) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {service}
                                </span>
                              ))
                            ) : (
                              <span className="text-xs text-gray-500">None available</span>
                            )}
                          </div>
                          {office.online_portal_url && (
                            <div className="flex items-center text-sm">
                              <ExternalLink className="h-4 w-4 mr-1" />
                              <a 
                                href={office.online_portal_url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 text-xs"
                              >
                                Online Portal
                              </a>
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => toggleRowExpansion(office.id || index.toString())}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                            title={isExpanded ? "Collapse details" : "Expand details"}
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                          
                          {downloadableApps.length > 0 && (
                            <button
                              className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                              title="Download applications"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>

                    {/* Expanded Row */}
                    {isExpanded && (
                      <tr className="bg-gray-50">
                        <td colSpan={5} className="px-6 py-4">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Detailed Instructions */}
                            {office.instructions && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Instructions & Requirements</h4>
                                <div className="space-y-3">
                                  {office.instructions.building && (
                                    <div className="border-l-4 border-blue-500 pl-3">
                                      <div className="text-sm font-medium text-gray-900">Building Permits</div>
                                      <div className="text-xs text-gray-600 mt-1">{office.instructions.building}</div>
                                    </div>
                                  )}
                                  {office.instructions.electrical && (
                                    <div className="border-l-4 border-yellow-500 pl-3">
                                      <div className="text-sm font-medium text-gray-900">Electrical Permits</div>
                                      <div className="text-xs text-gray-600 mt-1">{office.instructions.electrical}</div>
                                    </div>
                                  )}
                                  {office.instructions.requiredDocuments && (
                                    <div>
                                      <div className="text-sm font-medium text-gray-900 mb-2">Required Documents</div>
                                      <ul className="text-xs text-gray-600 space-y-1">
                                        {office.instructions.requiredDocuments.map((doc, idx) => (
                                          <li key={idx} className="flex items-start">
                                            <span className="mr-2">•</span>
                                            {doc}
                                          </li>
                                        ))}
                                      </ul>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Processing Times */}
                            {office.processingTimes && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Processing Times</h4>
                                <div className="space-y-2">
                                  {Object.entries(office.processingTimes).map(([type, time]) => (
                                    time && (
                                      <div key={type} className="flex justify-between text-xs">
                                        <span className="font-medium text-gray-700 capitalize">{type}:</span>
                                        <span className="text-gray-600">{formatProcessingTime(time)}</span>
                                      </div>
                                    )
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Downloadable Applications */}
                            {downloadableApps.length > 0 && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Downloadable Applications</h4>
                                <div className="space-y-2">
                                  {downloadableApps.map((app, idx) => (
                                    <div key={idx} className="flex items-center text-xs">
                                      <FileText className="w-3 h-3 mr-2 text-gray-400" />
                                      <a 
                                        href={app} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="text-blue-600 hover:text-blue-800"
                                      >
                                        Application {idx + 1}
                                      </a>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}

                            {/* Application Process */}
                            {office.instructions?.applicationProcess && (
                              <div>
                                <h4 className="text-sm font-semibold text-gray-900 mb-3">Application Process</h4>
                                <div className="text-xs text-gray-600">
                                  {office.instructions.applicationProcess}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
