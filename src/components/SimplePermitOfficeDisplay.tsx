'use client';

import React from 'react';
import {
  Phone, Mail, MapPin, Clock, Building,
  Zap, Droplets, Settings, CheckCircle, Globe,
  FileText, DollarSign, Calendar, Download, AlertCircle
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
    requiredDocuments?: string[];
    applicationProcess?: string;
  } | null;
  processingTimes?: {
    building?: { min?: number; max?: number; unit?: string; description?: string };
    electrical?: { min?: number; max?: number; unit?: string; description?: string };
    plumbing?: { min?: number; max?: number; unit?: string; description?: string };
    mechanical?: { min?: number; max?: number; unit?: string; description?: string };
    zoning?: { min?: number; max?: number; unit?: string; description?: string };
    general?: { min?: number; max?: number; unit?: string; description?: string };
  } | null;
  downloadableApplications?: {
    building?: string[];
    electrical?: string[];
    plumbing?: string[];
    mechanical?: string[];
    zoning?: string[];
    general?: string[];
  } | null;
  latitude?: string | null;
  longitude?: string | null;
  dataSource?: string;
  lastVerified?: string | null;
  distance?: number;
}

interface SimplePermitOfficeDisplayProps {
  offices: PermitOffice[];
}

export default function SimplePermitOfficeDisplay({ offices }: SimplePermitOfficeDisplayProps) {
  const formatFee = (fee: { amount?: number; description?: string; unit?: string } | undefined) => {
    if (!fee || !fee.amount) return fee?.description || 'Contact for pricing';
    return `$${fee.amount}${fee.unit ? ` per ${fee.unit}` : ''}${fee.description ? ` - ${fee.description}` : ''}`;
  };

  const formatProcessingTime = (time: { min?: number; max?: number; unit?: string; description?: string } | undefined) => {
    if (!time || !time.min) return time?.description || 'Contact for timing';
    const unit = time.unit || 'days';
    if (time.max && time.max !== time.min) {
      return `${time.min}-${time.max} ${unit}`;
    }
    return `${time.min} ${unit}`;
  };

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'building': return Building;
      case 'electrical': return Zap;
      case 'plumbing': return Droplets;
      case 'mechanical': return Settings;
      case 'zoning': return MapPin;
      case 'planning': return FileText;
      case 'inspections': return CheckCircle;
      default: return CheckCircle;
    }
  };

  const getServiceColor = (service: string) => {
    switch (service) {
      case 'building': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'electrical': return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'plumbing': return 'bg-cyan-50 text-cyan-700 border-cyan-200';
      case 'mechanical': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'zoning': return 'bg-green-50 text-green-700 border-green-200';
      case 'planning': return 'bg-indigo-50 text-indigo-700 border-indigo-200';
      case 'inspections': return 'bg-orange-50 text-orange-700 border-orange-200';
      default: return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

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
      {offices.map((office, index) => {
        const services = [];
        if (office.building_permits) services.push({ name: 'Building', key: 'building' });
        if (office.electrical_permits) services.push({ name: 'Electrical', key: 'electrical' });
        if (office.plumbing_permits) services.push({ name: 'Plumbing', key: 'plumbing' });
        if (office.mechanical_permits) services.push({ name: 'Mechanical', key: 'mechanical' });
        if (office.zoning_permits) services.push({ name: 'Zoning', key: 'zoning' });
        if (office.planning_review) services.push({ name: 'Planning', key: 'planning' });
        if (office.inspections) services.push({ name: 'Inspections', key: 'inspections' });

        const onlineServices = [];
        if (office.online_applications) onlineServices.push('Online Applications');
        if (office.online_payments) onlineServices.push('Online Payments');
        if (office.permit_tracking) onlineServices.push('Permit Tracking');

        return (
          <div key={office.id || index} className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-shadow duration-300">
            {/* Header Section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-white mb-2">
                    {office.department_name}
                  </h3>
                  <div className="flex items-center text-blue-100 mb-3">
                    <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                    <span className="text-sm">{office.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full text-xs font-medium">
                      {office.city}, {office.state}
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full text-xs font-medium">
                      {office.county} County
                    </span>
                    <span className="px-3 py-1 bg-white/20 backdrop-blur text-white rounded-full text-xs font-medium capitalize">
                      {office.jurisdiction_type}
                    </span>
                    {office.distance && (
                      <span className="px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-xs font-medium">
                        {office.distance.toFixed(1)} miles away
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Services Section */}
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Available Services
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {services.map((service) => {
                    const Icon = getServiceIcon(service.key);
                    return (
                      <div
                        key={service.key}
                        className={`flex items-center p-3 rounded-lg border ${getServiceColor(service.key)}`}
                      >
                        <Icon className="w-4 h-4 mr-2" />
                        <span className="text-sm font-medium">{service.name}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Contact and Hours Section */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                  <div className="space-y-3">
                    {office.phone && (
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-3 text-gray-400" />
                        <a href={`tel:${office.phone}`} className="text-blue-600 hover:underline text-sm">
                          {office.phone}
                        </a>
                      </div>
                    )}
                    {office.email && (
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-3 text-gray-400" />
                        <a href={`mailto:${office.email}`} className="text-blue-600 hover:underline text-sm">
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
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {office.website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {!office.phone && !office.email && !office.website && (
                      <p className="text-sm text-gray-500 italic">No contact information available</p>
                    )}
                  </div>
                </div>

                {/* Operating Hours */}
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    Operating Hours
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                    {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => {
                      const dayKey = `hours_${day.toLowerCase()}` as keyof PermitOffice;
                      const hours = office[dayKey];
                      const hoursText = typeof hours === 'string' ? hours : 'Closed';
                      return (
                        <div key={day} className="flex justify-between text-sm">
                          <span className="font-medium text-gray-700">{day.slice(0, 3)}:</span>
                          <span className="text-gray-600">
                            {hoursText}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Online Services */}
              {onlineServices.length > 0 && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Online Services</h4>
                  <div className="flex flex-wrap gap-2">
                    {onlineServices.map((service, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium border border-green-200"
                      >
                        <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                        {service}
                      </span>
                    ))}
                  </div>
                  {office.online_portal_url && (
                    <a
                      href={office.online_portal_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium"
                    >
                      <Globe className="w-4 h-4 mr-1.5" />
                      Visit Online Portal →
                    </a>
                  )}
                </div>
              )}

              {/* Fees Section - Complete Display */}
              {office.permitFees && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Permit Fees
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {office.permitFees.building && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Building Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.building)}</div>
                        </div>
                      )}
                      {office.permitFees.electrical && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Electrical Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.electrical)}</div>
                        </div>
                      )}
                      {office.permitFees.plumbing && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Plumbing Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.plumbing)}</div>
                        </div>
                      )}
                      {office.permitFees.mechanical && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Mechanical Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.mechanical)}</div>
                        </div>
                      )}
                      {office.permitFees.zoning && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Zoning Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.zoning)}</div>
                        </div>
                      )}
                      {office.permitFees.general && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">General Fees</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.general)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Times - Complete Display */}
              {office.processingTimes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Processing Times
                  </h4>
                  <div className="bg-amber-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {office.processingTimes.building && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">Building Permits</div>
                            {office.processingTimes.building.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.building.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.building)}</span>
                        </div>
                      )}
                      {office.processingTimes.electrical && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">Electrical Permits</div>
                            {office.processingTimes.electrical.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.electrical.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.electrical)}</span>
                        </div>
                      )}
                      {office.processingTimes.plumbing && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">Plumbing Permits</div>
                            {office.processingTimes.plumbing.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.plumbing.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.plumbing)}</span>
                        </div>
                      )}
                      {office.processingTimes.mechanical && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">Mechanical Permits</div>
                            {office.processingTimes.mechanical.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.mechanical.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.mechanical)}</span>
                        </div>
                      )}
                      {office.processingTimes.zoning && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">Zoning Permits</div>
                            {office.processingTimes.zoning.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.zoning.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.zoning)}</span>
                        </div>
                      )}
                      {office.processingTimes.general && (
                        <div className="flex justify-between items-start pb-3 border-b border-amber-100 last:border-0">
                          <div>
                            <div className="font-medium text-gray-900">General Processing</div>
                            {office.processingTimes.general.description && (
                              <div className="text-xs text-gray-600 mt-1">{office.processingTimes.general.description}</div>
                            )}
                          </div>
                          <span className="text-sm font-medium text-amber-700">{formatProcessingTime(office.processingTimes.general)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Detailed Instructions & Requirements - Complete Display */}
              {office.instructions && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    Instructions & Requirements
                  </h4>
                  <div className="space-y-4">
                    {/* General Instructions */}
                    {office.instructions.general && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">General Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.general}</p>
                      </div>
                    )}

                    {/* Building Permit Instructions */}
                    {office.instructions.building && (
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                        <h5 className="font-medium text-gray-900 mb-2">Building Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.building}</p>
                      </div>
                    )}

                    {/* Electrical Permit Instructions */}
                    {office.instructions.electrical && (
                      <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                        <h5 className="font-medium text-gray-900 mb-2">Electrical Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.electrical}</p>
                      </div>
                    )}

                    {/* Plumbing Permit Instructions */}
                    {office.instructions.plumbing && (
                      <div className="bg-cyan-50 rounded-lg p-4 border-l-4 border-cyan-400">
                        <h5 className="font-medium text-gray-900 mb-2">Plumbing Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.plumbing}</p>
                      </div>
                    )}

                    {/* Mechanical Permit Instructions */}
                    {office.instructions.mechanical && (
                      <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                        <h5 className="font-medium text-gray-900 mb-2">Mechanical Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.mechanical}</p>
                      </div>
                    )}

                    {/* Zoning Permit Instructions */}
                    {office.instructions.zoning && (
                      <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                        <h5 className="font-medium text-gray-900 mb-2">Zoning Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.zoning}</p>
                      </div>
                    )}

                    {/* Required Documents */}
                    {office.instructions.requiredDocuments && office.instructions.requiredDocuments.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3">📋 Required Documents</h5>
                        <ul className="space-y-2">
                          {office.instructions.requiredDocuments.map((doc, idx) => (
                            <li key={idx} className="flex items-start">
                              <CheckCircle className="w-4 h-4 text-indigo-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{doc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Application Process */}
                    {office.instructions.applicationProcess && (
                      <div className="bg-orange-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-2">📝 Application Process</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.applicationProcess}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Downloadable Applications Section */}
              {office.downloadableApplications && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-4 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Downloadable Applications
                  </h4>
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="space-y-3">
                      {office.downloadableApplications.building && office.downloadableApplications.building.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Building Permit Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.building.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Building Permit Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {office.downloadableApplications.electrical && office.downloadableApplications.electrical.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Electrical Permit Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.electrical.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Electrical Permit Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {office.downloadableApplications.plumbing && office.downloadableApplications.plumbing.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Plumbing Permit Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.plumbing.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Plumbing Permit Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {office.downloadableApplications.mechanical && office.downloadableApplications.mechanical.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Mechanical Permit Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.mechanical.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Mechanical Permit Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {office.downloadableApplications.zoning && office.downloadableApplications.zoning.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">Zoning Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.zoning.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                Zoning Application Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      {office.downloadableApplications.general && office.downloadableApplications.general.length > 0 && (
                        <div>
                          <h5 className="font-medium text-gray-900 mb-2">General Applications</h5>
                          <div className="space-y-1">
                            {office.downloadableApplications.general.map((url, idx) => (
                              <a
                                key={idx}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center text-sm text-blue-600 hover:text-blue-800 hover:underline"
                              >
                                <FileText className="w-4 h-4 mr-2" />
                                General Application Form {idx + 1}
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Metadata */}
              <div className="border-t pt-6 mt-6">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    {office.dataSource && (
                      <span className="flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Source: {office.dataSource}
                      </span>
                    )}
                    {office.lastVerified && (
                      <span>Last verified: {new Date(office.lastVerified).toLocaleDateString()}</span>
                    )}
                  </div>
                  {office.latitude && office.longitude && (
                    <a
                      href={`https://maps.google.com/?q=${office.latitude},${office.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 flex items-center"
                    >
                      <MapPin className="w-3 h-3 mr-1" />
                      View on Map
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}