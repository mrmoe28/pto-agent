'use client';

import React from 'react';
import {
  Phone, Mail, MapPin, Clock, Building,
  Zap, Droplets, Settings, CheckCircle, Globe,
  FileText, DollarSign, Calendar
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

              {/* Fees Section */}
              {office.permitFees && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <DollarSign className="w-4 h-4 mr-2" />
                    Sample Permit Fees
                  </h4>
                  <div className="bg-blue-50 rounded-lg p-4">
                    <div className="grid md:grid-cols-2 gap-3">
                      {office.permitFees.building && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Building:</span>
                          <span className="ml-2 text-gray-600">{formatFee(office.permitFees.building)}</span>
                        </div>
                      )}
                      {office.permitFees.electrical && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Electrical:</span>
                          <span className="ml-2 text-gray-600">{formatFee(office.permitFees.electrical)}</span>
                        </div>
                      )}
                      {office.permitFees.plumbing && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Plumbing:</span>
                          <span className="ml-2 text-gray-600">{formatFee(office.permitFees.plumbing)}</span>
                        </div>
                      )}
                      {office.permitFees.mechanical && (
                        <div className="text-sm">
                          <span className="font-medium text-gray-700">Mechanical:</span>
                          <span className="ml-2 text-gray-600">{formatFee(office.permitFees.mechanical)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Processing Times */}
              {office.processingTimes && (
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    Processing Times
                  </h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    {Object.entries(office.processingTimes).map(([type, time]) => (
                      time && (
                        <div key={type} className="flex justify-between p-3 bg-gray-50 rounded-lg">
                          <span className="font-medium text-gray-700 capitalize text-sm">{type}:</span>
                          <span className="text-gray-600 text-sm">{formatProcessingTime(time)}</span>
                        </div>
                      )
                    ))}
                  </div>
                </div>
              )}

              {/* Instructions */}
              {office.instructions && (
                <div className="border-t pt-6">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Instructions & Requirements</h4>
                  <div className="space-y-4">
                    {office.instructions.general && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700">{office.instructions.general}</p>
                      </div>
                    )}
                    {office.instructions.requiredDocuments && office.instructions.requiredDocuments.length > 0 && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Required Documents:</h5>
                        <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-2">
                          {office.instructions.requiredDocuments.map((doc, idx) => (
                            <li key={idx}>{doc}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {office.instructions.applicationProcess && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-900 mb-2">Application Process:</h5>
                        <p className="text-sm text-gray-600">{office.instructions.applicationProcess}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}