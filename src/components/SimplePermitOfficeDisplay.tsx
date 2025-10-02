'use client';

import React, { useState } from 'react';
import {
  Phone, Mail, MapPin, Clock, Building,
  Zap, Droplets, Settings, CheckCircle, Globe,
  FileText, DollarSign, Calendar, Download, AlertCircle, Loader2, Eye
} from 'lucide-react';
import FavoriteButton from './FavoriteButton';
import PermitOfficeDialog from './PermitOfficeDialog';

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
    structure?: string;
    minimum?: string;
    technologyFee?: string;
    fireProtection?: string;
    miscellaneous?: string;
    masterHomePlan?: string;
    billboardSign?: string;
    sitePlanReview?: string;
    notes?: string;
  } | null;
  instructions?: {
    general?: string;
    building?: string;
    electrical?: string;
    plumbing?: string;
    mechanical?: string;
    zoning?: string;
    residential?: string;
    commercial?: string;
    requiredDocuments?: string[];
    applicationProcess?: string;
    specialRequirements?: string[];
  } | null;
  processingTimes?: {
    building?: { min?: number; max?: number; unit?: string; description?: string };
    electrical?: { min?: number; max?: number; unit?: string; description?: string };
    plumbing?: { min?: number; max?: number; unit?: string; description?: string };
    mechanical?: { min?: number; max?: number; unit?: string; description?: string };
    zoning?: { min?: number; max?: number; unit?: string; description?: string };
    general?: { min?: number; max?: number; unit?: string; description?: string };
    meetings?: { bpr?: string; spr?: string };
  } | null;
  downloadableApplications?: {
    building?: string[];
    electrical?: string[];
    plumbing?: string[];
    mechanical?: string[];
    zoning?: string[];
    general?: string[];
    specialized?: string[];
    flood?: string[];
  } | null;
  latitude?: string | null;
  longitude?: string | null;
  dataSource?: string;
  lastVerified?: string | null;
  distance?: number;
}

interface ScrapedForm {
  name: string;
  url: string;
  type: 'building' | 'electrical' | 'plumbing' | 'mechanical' | 'zoning' | 'general';
  description?: string;
  fileType?: string;
}

interface BusinessHours {
  monday?: string;
  tuesday?: string;
  wednesday?: string;
  thursday?: string;
  friday?: string;
  saturday?: string;
  sunday?: string;
}

interface ScrapedForms {
  building: ScrapedForm[];
  electrical: ScrapedForm[];
  plumbing: ScrapedForm[];
  businessHours?: BusinessHours;
}

interface SimplePermitOfficeDisplayProps {
  offices: PermitOffice[];
  permitTypeFilter?: string;
}

export default function SimplePermitOfficeDisplay({ offices, permitTypeFilter = 'all' }: SimplePermitOfficeDisplayProps) {
  const [scrapedForms, setScrapedForms] = useState<Record<string, ScrapedForms>>({});
  const [loadingForms, setLoadingForms] = useState<Record<string, boolean>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Function to scrape forms for a specific office
  const scrapeFormsForOffice = async (office: PermitOffice) => {
    if (!office.website) return;

    const officeKey = office.id || `${office.city}-${office.department_name}`;

    if (scrapedForms[officeKey] || loadingForms[officeKey]) {
      return; // Already loaded or loading
    }

    setLoadingForms(prev => ({ ...prev, [officeKey]: true }));
    setFormErrors(prev => ({ ...prev, [officeKey]: '' }));

    try {
      const response = await fetch('/api/permit-forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          websiteUrl: office.website,
          officeName: office.department_name
        })
      });

      const data = await response.json();

      if (data.success) {
        setScrapedForms(prev => ({
          ...prev,
          [officeKey]: data.forms
        }));
      } else {
        setFormErrors(prev => ({
          ...prev,
          [officeKey]: data.error || 'Failed to load forms'
        }));
      }
    } catch {
      setFormErrors(prev => ({
        ...prev,
        [officeKey]: 'Error loading forms'
      }));
    } finally {
      setLoadingForms(prev => ({ ...prev, [officeKey]: false }));
    }
  };

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

  const convertTo12HourFormat = (timeString: string): string => {
    if (!timeString || timeString.toLowerCase().includes('closed') || timeString.toLowerCase().includes('n/a')) {
      return 'Closed';
    }

    // Handle special cases
    if (timeString.toLowerCase().includes('24') || timeString.toLowerCase().includes('24/7')) {
      return '24 Hours';
    }

    if (timeString.toLowerCase().includes('appointment') || timeString.toLowerCase().includes('by appt')) {
      return 'By Appointment';
    }

    // Handle time ranges with various separators (-, to, through, etc.)
    const rangePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|a\.m\.|p\.m\.)?\s*[-–—to\s]+\s*(\d{1,2}):?(\d{0,2})\s*(am|pm|a\.m\.|p\.m\.)?/gi;

    if (rangePattern.test(timeString)) {
      return timeString.replace(rangePattern, (match, startHour, startMin, startPeriod, endHour, endMin, endPeriod) => {
        const startTime = convertSingleTime(parseInt(startHour), startMin || '00', startPeriod);
        const endTime = convertSingleTime(parseInt(endHour), endMin || '00', endPeriod || startPeriod);
        return `${startTime} - ${endTime}`;
      });
    }

    // Handle single times
    const singleTimePattern = /(\d{1,2}):?(\d{0,2})\s*(am|pm|a\.m\.|p\.m\.)?/gi;
    return timeString.replace(singleTimePattern, (match, hours, minutes, period) => {
      return convertSingleTime(parseInt(hours), minutes || '00', period);
    });
  };

  const convertSingleTime = (hour: number, minutes: string, period?: string): string => {
    let convertedHour = hour;
    let finalPeriod = period?.replace(/\./g, '').toUpperCase();

    // If no period specified, determine based on hour and context
    if (!finalPeriod) {
      if (hour >= 13 && hour <= 23) {
        // Convert 24-hour to 12-hour
        convertedHour = hour - 12;
        finalPeriod = 'PM';
      } else if (hour === 0) {
        convertedHour = 12;
        finalPeriod = 'AM';
      } else if (hour === 12) {
        finalPeriod = 'PM'; // Noon
      } else if (hour >= 1 && hour <= 6) {
        // Ambiguous hours - assume PM for business hours (1-6 PM is more common than 1-6 AM)
        finalPeriod = 'PM';
      } else if (hour >= 7 && hour <= 11) {
        // Morning business hours
        finalPeriod = 'AM';
      } else {
        finalPeriod = hour >= 12 ? 'PM' : 'AM';
      }
    } else {
      // Handle cases where period is specified but hour might need conversion
      if (hour > 12) {
        convertedHour = hour - 12;
        finalPeriod = 'PM';
      } else if (hour === 0) {
        convertedHour = 12;
        finalPeriod = 'AM';
      }
    }

    // Format minutes to always show 2 digits
    const formattedMinutes = minutes.padEnd(2, '0');

    // Return clean format
    if (formattedMinutes === '00') {
      return `${convertedHour} ${finalPeriod}`;
    } else {
      return `${convertedHour}:${formattedMinutes} ${finalPeriod}`;
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
        // Filter services based on permitTypeFilter
        const allServices = [];
        if (office.building_permits) allServices.push({ name: 'Building', key: 'building' });
        if (office.electrical_permits) allServices.push({ name: 'Electrical', key: 'electrical' });
        if (office.plumbing_permits) allServices.push({ name: 'Plumbing', key: 'plumbing' });
        if (office.mechanical_permits) allServices.push({ name: 'Mechanical', key: 'mechanical' });
        if (office.zoning_permits) allServices.push({ name: 'Zoning', key: 'zoning' });
        if (office.planning_review) allServices.push({ name: 'Planning', key: 'planning' });
        if (office.inspections) allServices.push({ name: 'Inspections', key: 'inspections' });

        // Apply filter if not "all"
        const services = permitTypeFilter === 'all'
          ? allServices
          : allServices.filter(service => service.key === permitTypeFilter);

        // Helper function to check if a section should be shown based on permit type filter
        const shouldShowSection = (sectionType: string) => {
          if (permitTypeFilter === 'all') return true;
          return sectionType === permitTypeFilter || sectionType === 'general';
        };

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
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-2xl font-bold text-white">
                      {office.department_name}
                    </h3>
                    {office.id && (
                      <FavoriteButton 
                        permitOfficeId={office.id} 
                        size="sm"
                        className="ml-4"
                      />
                    )}
                  </div>
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
                  
                  {/* Action Buttons */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PermitOfficeDialog 
                      office={office}
                      trigger={
                        <button className="px-3 py-1.5 text-xs bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-1">
                          <Eye className="w-3 h-3" />
                          View Details
                        </button>
                      }
                    />
                    {office.website && (
                      <button
                        onClick={() => office.website && window.open(office.website, '_blank')}
                        className="px-3 py-1.5 text-xs bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-1"
                      >
                        <Globe className="w-3 h-3" />
                        Visit Website
                      </button>
                    )}
                    {office.address && (
                      <button
                        onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(office.address)}`, '_blank')}
                        className="px-3 py-1.5 text-xs bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-1"
                      >
                        <MapPin className="w-3 h-3" />
                        View on Map
                      </button>
                    )}
                    {office.phone && (
                      <button
                        onClick={() => window.open(`tel:${office.phone}`, '_blank')}
                        className="px-3 py-1.5 text-xs bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors flex items-center gap-1"
                      >
                        <Phone className="w-3 h-3" />
                        Call
                      </button>
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
                      const hoursText = typeof hours === 'string' ? convertTo12HourFormat(hours) : 'Closed';
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
                      {office.permitFees.structure && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Building Permit Fee</div>
                          <div className="text-sm text-gray-700">{office.permitFees.structure}</div>
                        </div>
                      )}
                      {office.permitFees.minimum && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Minimum Fee</div>
                          <div className="text-sm text-gray-700">{office.permitFees.minimum}</div>
                        </div>
                      )}
                      {office.permitFees.technologyFee && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Technology Fee</div>
                          <div className="text-sm text-gray-700">{office.permitFees.technologyFee}</div>
                        </div>
                      )}
                      {office.permitFees.fireProtection && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Fire Protection Systems</div>
                          <div className="text-sm text-gray-700">{office.permitFees.fireProtection}</div>
                        </div>
                      )}
                      {office.permitFees.miscellaneous && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Miscellaneous Work</div>
                          <div className="text-sm text-gray-700">{office.permitFees.miscellaneous}</div>
                        </div>
                      )}
                      {office.permitFees.masterHomePlan && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Master Home Plan</div>
                          <div className="text-sm text-gray-700">{office.permitFees.masterHomePlan}</div>
                        </div>
                      )}
                      {office.permitFees.billboardSign && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Billboard Sign</div>
                          <div className="text-sm text-gray-700">{office.permitFees.billboardSign}</div>
                        </div>
                      )}
                      {office.permitFees.sitePlanReview && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Site Plan Review</div>
                          <div className="text-sm text-gray-700">{office.permitFees.sitePlanReview}</div>
                        </div>
                      )}
                      {office.permitFees.building && shouldShowSection('building') && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Building Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.building)}</div>
                        </div>
                      )}
                      {office.permitFees.electrical && shouldShowSection('electrical') && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Electrical Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.electrical)}</div>
                        </div>
                      )}
                      {office.permitFees.plumbing && shouldShowSection('plumbing') && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Plumbing Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.plumbing)}</div>
                        </div>
                      )}
                      {office.permitFees.mechanical && shouldShowSection('mechanical') && (
                        <div className="pb-3 border-b border-blue-100 last:border-0">
                          <div className="font-medium text-gray-900 mb-1">Mechanical Permit</div>
                          <div className="text-sm text-gray-700">{formatFee(office.permitFees.mechanical)}</div>
                        </div>
                      )}
                      {office.permitFees.zoning && shouldShowSection('zoning') && (
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
                      {office.permitFees.notes && (
                        <div className="pt-3 border-t border-blue-200">
                          <div className="text-xs text-gray-600 italic">{office.permitFees.notes}</div>
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
                      {office.processingTimes.meetings && (
                        <div className="pt-3 border-t border-amber-200">
                          <div className="font-medium text-gray-900 mb-2">Review Meetings</div>
                          <div className="space-y-1 text-sm text-gray-700">
                            {office.processingTimes.meetings.bpr && (
                              <div><span className="font-medium">BPR:</span> {office.processingTimes.meetings.bpr}</div>
                            )}
                            {office.processingTimes.meetings.spr && (
                              <div><span className="font-medium">SPR:</span> {office.processingTimes.meetings.spr}</div>
                            )}
                          </div>
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
                    {office.instructions.building && shouldShowSection('building') && (
                      <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
                        <h5 className="font-medium text-gray-900 mb-2">Building Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.building}</p>
                      </div>
                    )}

                    {/* Electrical Permit Instructions */}
                    {office.instructions.electrical && shouldShowSection('electrical') && (
                      <div className="bg-yellow-50 rounded-lg p-4 border-l-4 border-yellow-400">
                        <h5 className="font-medium text-gray-900 mb-2">Electrical Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.electrical}</p>
                      </div>
                    )}

                    {/* Plumbing Permit Instructions */}
                    {office.instructions.plumbing && shouldShowSection('plumbing') && (
                      <div className="bg-cyan-50 rounded-lg p-4 border-l-4 border-cyan-400">
                        <h5 className="font-medium text-gray-900 mb-2">Plumbing Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.plumbing}</p>
                      </div>
                    )}

                    {/* Mechanical Permit Instructions */}
                    {office.instructions.mechanical && shouldShowSection('mechanical') && (
                      <div className="bg-purple-50 rounded-lg p-4 border-l-4 border-purple-400">
                        <h5 className="font-medium text-gray-900 mb-2">Mechanical Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.mechanical}</p>
                      </div>
                    )}

                    {/* Zoning Permit Instructions */}
                    {office.instructions.zoning && shouldShowSection('zoning') && (
                      <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
                        <h5 className="font-medium text-gray-900 mb-2">Zoning Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.zoning}</p>
                      </div>
                    )}

                    {/* Residential Permit Instructions */}
                    {office.instructions.residential && (
                      <div className="bg-amber-50 rounded-lg p-4 border-l-4 border-amber-400">
                        <h5 className="font-medium text-gray-900 mb-2">Residential Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.residential}</p>
                      </div>
                    )}

                    {/* Commercial Permit Instructions */}
                    {office.instructions.commercial && (
                      <div className="bg-indigo-50 rounded-lg p-4 border-l-4 border-indigo-400">
                        <h5 className="font-medium text-gray-900 mb-2">Commercial Permit Instructions</h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.commercial}</p>
                      </div>
                    )}

                    {/* Required Documents */}
                    {office.instructions.requiredDocuments && office.instructions.requiredDocuments.length > 0 && (
                      <div className="bg-indigo-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                          </svg>
                          Required Documents
                        </h5>
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
                        <h5 className="font-medium text-gray-900 mb-2 flex items-center">
                          <svg className="w-4 h-4 mr-2 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Application Process
                        </h5>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{office.instructions.applicationProcess}</p>
                      </div>
                    )}

                    {/* Special Requirements */}
                    {office.instructions.specialRequirements && office.instructions.specialRequirements.length > 0 && (
                      <div className="bg-red-50 rounded-lg p-4">
                        <h5 className="font-medium text-gray-900 mb-3 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-2 text-red-600" />
                          Special Requirements
                        </h5>
                        <ul className="space-y-2">
                          {office.instructions.specialRequirements.map((req, idx) => (
                            <li key={idx} className="flex items-start">
                              <AlertCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{req}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Real Downloadable Applications Section */}
              <div className="border-t pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 flex items-center">
                    <Download className="w-4 h-4 mr-2" />
                    Permit Applications
                  </h4>
                  {office.website && (
                    <button
                      onClick={() => scrapeFormsForOffice(office)}
                      disabled={loadingForms[office.id || `${office.city}-${office.department_name}`]}
                      className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingForms[office.id || `${office.city}-${office.department_name}`] ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        <>
                          <Download className="w-3 h-3" />
                          Get Forms
                        </>
                      )}
                    </button>
                  )}
                </div>

                {(() => {
                  const officeKey = office.id || `${office.city}-${office.department_name}`;
                  const forms = scrapedForms[officeKey];
                  const error = formErrors[officeKey];
                  const loading = loadingForms[officeKey];

                  // PRIORITY 1: Check for database forms FIRST (always show if available)
                  if (office.downloadableApplications) {
                    const hasAnyForms = Object.values(office.downloadableApplications).some(
                      formArray => formArray && formArray.length > 0
                    );

                    if (hasAnyForms) {
                      return (
                        <div className="bg-slate-50 rounded-lg p-4">
                          <div className="space-y-4">
                            {office.downloadableApplications.general && office.downloadableApplications.general.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">General Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.general.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.building && office.downloadableApplications.building.length > 0 && shouldShowSection('building') && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Building Permit Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.building.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-blue-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.electrical && office.downloadableApplications.electrical.length > 0 && shouldShowSection('electrical') && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Electrical Permit Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.electrical.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-yellow-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.plumbing && office.downloadableApplications.plumbing.length > 0 && shouldShowSection('plumbing') && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Plumbing Permit Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.plumbing.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-cyan-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.mechanical && office.downloadableApplications.mechanical.length > 0 && shouldShowSection('mechanical') && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Mechanical Permit Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.mechanical.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-purple-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.zoning && office.downloadableApplications.zoning.length > 0 && shouldShowSection('zoning') && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Zoning Permit Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.zoning.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-green-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.specialized && office.downloadableApplications.specialized.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Specialized Permits</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.specialized.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-indigo-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {office.downloadableApplications.flood && office.downloadableApplications.flood.length > 0 && (
                              <div>
                                <h5 className="font-medium text-gray-900 mb-2">Flood-Related Applications</h5>
                                <div className="space-y-2">
                                  {office.downloadableApplications.flood.map((formName, idx) => (
                                    <div
                                      key={idx}
                                      className="flex items-center p-2 bg-white rounded border border-gray-200"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2 text-teal-600 flex-shrink-0" />
                                      <span className="text-sm text-gray-700">{formName}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                          {office.website && (
                            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                              <p className="text-xs text-blue-800 mb-2">
                                📋 These forms are available on the permit office website
                              </p>
                              <a
                                href={office.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800 font-medium"
                              >
                                <Globe className="w-4 h-4 mr-1.5" />
                                Visit website to download forms →
                              </a>
                            </div>
                          )}
                        </div>
                      );
                    }
                  }

                  // PRIORITY 2: Check scraping errors (only if no database forms)
                  if (error) {
                    return (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center text-red-700 text-sm">
                          <AlertCircle className="w-4 h-4 mr-2" />
                          {error}
                        </div>
                      </div>
                    );
                  }

                  // PRIORITY 3: Check if currently scraping
                  if (loading) {
                    return (
                      <div className="bg-gray-50 rounded-lg p-8 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-gray-600">Searching for permit forms...</p>
                      </div>
                    );
                  }

                  // PRIORITY 4: Check if scraped forms exist
                  if (forms) {
                    const hasAnyForms = Object.values(forms).some(formArray => formArray.length > 0);

                    if (!hasAnyForms) {
                      return (
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                          <div className="flex items-center text-yellow-700 text-sm">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            No downloadable forms found on the website. Contact the office directly for applications.
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="bg-slate-50 rounded-lg p-4">
                        <div className="space-y-4">
                          {Object.entries(forms).map(([type, formArray]) => {
                            if (formArray.length === 0) return null;

                            return (
                              <div key={type}>
                                <h5 className="font-medium text-gray-900 mb-2 capitalize">
                                  {type} Permit Applications
                                </h5>
                                <div className="space-y-2">
                                  {formArray.map((form: ScrapedForm, idx: number) => (
                                    <a
                                      key={idx}
                                      href={form.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors group"
                                    >
                                      <div className="flex items-center">
                                        <FileText className="w-4 h-4 mr-3 text-gray-400 group-hover:text-blue-600" />
                                        <div>
                                          <div className="text-sm font-medium text-gray-900 group-hover:text-blue-900">
                                            {form.name}
                                          </div>
                                          {form.description && (
                                            <div className="text-xs text-gray-500">
                                              {form.description}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                      <div className="flex items-center text-xs text-gray-500">
                                        {form.fileType && (
                                          <span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium mr-2">
                                            {form.fileType}
                                          </span>
                                        )}
                                        <Download className="w-3 h-3" />
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  }

                  // PRIORITY 5: Default fallback state
                  return (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 mb-3">
                        {office.website
                          ? "Click 'Get Forms' to search for downloadable permit applications"
                          : "No website available for this office"
                        }
                      </p>
                      {!office.website && (
                        <p className="text-xs text-gray-500">
                          Contact the office directly for permit applications
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>

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