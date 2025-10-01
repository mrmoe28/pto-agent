'use client'

import React, { useState } from 'react'
import { PermitOffice, PermitFee, ProcessingTime, DownloadableApplication } from '@/lib/permit-office-search'
import {
  Phone, Mail, Globe, Clock, FileText, DollarSign,
  Users, Building, ExternalLink, Download, ChevronDown, ChevronUp,
  AlertCircle, CheckCircle, Calendar, Briefcase
} from 'lucide-react'

interface ComprehensiveOfficeDetailsProps {
  office: PermitOffice
}

export default function ComprehensiveOfficeDetails({ office }: ComprehensiveOfficeDetailsProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    basics: true,
    contact: false,
    services: false,
    fees: false,
    instructions: false,
    applications: false,
    processing: false,
    staff: false,
    additional: false
  })

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }))
  }

  const formatFeeData = (fees: import('../lib/permit-office-search').PermitFees) => {
    return Object.entries(fees).map(([category, feeList]) => {
      const fees = Array.isArray(feeList) ? feeList : [feeList]
      return { category, fees }
    })
  }

  const formatInstructions = (instructions: import('../lib/permit-office-search').Instructions) => {
    return Object.entries(instructions).map(([type, instruction]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      content: instruction
    }))
  }

  const formatApplications = (apps: import('../lib/permit-office-search').DownloadableApplications) => {
    return Object.entries(apps).map(([category, urls]) => {
      const links = Array.isArray(urls) ? urls : [urls]
      return { category, links }
    })
  }

  const formatProcessingTimes = (times: import('../lib/permit-office-search').ProcessingTimes) => {
    return Object.entries(times).map(([type, timeInfo]) => {
      if (Array.isArray(timeInfo)) {
        return { type, times: timeInfo }
      }
      return { type, times: [timeInfo] }
    })
  }

  const Section = ({
    title,
    sectionKey,
    icon: Icon,
    children,
    badge
  }: {
    title: string
    sectionKey: string
    icon: React.ElementType
    children: React.ReactNode
    badge?: string | number
  }) => (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={() => toggleSection(sectionKey)}
        className="w-full px-6 py-4 bg-gray-50 hover:bg-gray-100 flex items-center justify-between transition-colors"
      >
        <div className="flex items-center space-x-3">
          <Icon className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {badge && (
            <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded">
              {badge}
            </span>
          )}
        </div>
        {expandedSections[sectionKey] ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {expandedSections[sectionKey] && (
        <div className="px-6 py-4 bg-white">
          {children}
        </div>
      )}
    </div>
  )

  const ConfidenceScore = ({ score }: { score: number }) => {
    const percentage = Math.round(score * 100)
    const color = score >= 0.8 ? 'text-green-600' : score >= 0.6 ? 'text-yellow-600' : 'text-red-600'
    const bgColor = score >= 0.8 ? 'bg-green-100' : score >= 0.6 ? 'bg-yellow-100' : 'bg-red-100'

    return (
      <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bgColor} ${color}`}>
        {score >= 0.8 ? <CheckCircle className="h-3 w-3 mr-1" /> : <AlertCircle className="h-3 w-3 mr-1" />}
        {percentage}% Complete
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with confidence score */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{office.department_name}</h2>
            <p className="text-gray-600 mt-1">{office.city}, {office.county} County, {office.state}</p>
            {office.confidence_score && (
              <div className="mt-2">
                <ConfidenceScore score={office.confidence_score} />
              </div>
            )}
          </div>
          {office.pages_crawled && office.pages_crawled > 1 && (
            <div className="text-right text-sm text-gray-500">
              <p>Data from {office.pages_crawled} pages</p>
              <p>Crawl depth: {office.crawl_depth}</p>
            </div>
          )}
        </div>
      </div>

      {/* Basic Information */}
      <Section title="Basic Information" sectionKey="basics" icon={Building}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">Jurisdiction Type</p>
            <p className="text-gray-900 capitalize">{office.jurisdiction_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Office Type</p>
            <p className="text-gray-900 capitalize">{office.office_type}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Address</p>
            <p className="text-gray-900">{office.address}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">Data Source</p>
            <p className="text-gray-900 capitalize">{office.data_source}</p>
          </div>
        </div>
      </Section>

      {/* Contact Information */}
      <Section
        title="Contact Information"
        sectionKey="contact"
        icon={Phone}
        badge={[office.phone, office.email, office.fax, ...(office.alternative_phones || []), ...(office.alternative_emails || [])].filter(Boolean).length}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {office.phone && (
              <div className="flex items-center space-x-2">
                <Phone className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">{office.phone}</span>
              </div>
            )}
            {office.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-400" />
                <a href={`mailto:${office.email}`} className="text-blue-600 hover:underline">
                  {office.email}
                </a>
              </div>
            )}
            {office.fax && (
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-400" />
                <span className="text-gray-900">Fax: {office.fax}</span>
              </div>
            )}
            {office.website && (
              <div className="flex items-center space-x-2">
                <Globe className="h-4 w-4 text-gray-400" />
                <a href={office.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                  Visit Website
                </a>
              </div>
            )}
          </div>

          {/* Alternative contacts */}
          {(office.alternative_phones?.length || office.alternative_emails?.length) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Additional Contacts</h4>
              <div className="space-y-2">
                {office.alternative_phones?.map((phone, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span className="text-gray-600">{phone}</span>
                  </div>
                ))}
                {office.alternative_emails?.map((email, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    <a href={`mailto:${email}`} className="text-blue-600 hover:underline">
                      {email}
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Office Hours */}
          {(office.hours_monday || office.hours_tuesday || office.hours_wednesday || office.hours_thursday || office.hours_friday) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Office Hours</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                {office.hours_monday && <div><span className="font-medium">Monday:</span> {office.hours_monday}</div>}
                {office.hours_tuesday && <div><span className="font-medium">Tuesday:</span> {office.hours_tuesday}</div>}
                {office.hours_wednesday && <div><span className="font-medium">Wednesday:</span> {office.hours_wednesday}</div>}
                {office.hours_thursday && <div><span className="font-medium">Thursday:</span> {office.hours_thursday}</div>}
                {office.hours_friday && <div><span className="font-medium">Friday:</span> {office.hours_friday}</div>}
                {office.hours_saturday && <div><span className="font-medium">Saturday:</span> {office.hours_saturday}</div>}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Services Available */}
      <Section
        title="Services Available"
        sectionKey="services"
        icon={Briefcase}
        badge={[office.building_permits, office.electrical_permits, office.plumbing_permits, office.mechanical_permits, office.zoning_permits, office.planning_review, office.inspections].filter(Boolean).length}
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {office.building_permits && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Building Permits</span></div>}
            {office.electrical_permits && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Electrical Permits</span></div>}
            {office.plumbing_permits && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Plumbing Permits</span></div>}
            {office.mechanical_permits && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Mechanical Permits</span></div>}
            {office.zoning_permits && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Zoning Permits</span></div>}
            {office.planning_review && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Planning Review</span></div>}
            {office.inspections && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-green-500" /><span>Inspections</span></div>}
          </div>

          {/* Digital Services */}
          {(office.online_applications || office.online_payments || office.permit_tracking) && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Digital Services</h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {office.online_applications && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span>Online Applications</span></div>}
                {office.online_payments && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span>Online Payments</span></div>}
                {office.permit_tracking && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span>Permit Tracking</span></div>}
                {office.document_upload_supported && <div className="flex items-center space-x-2"><CheckCircle className="h-4 w-4 text-blue-500" /><span>Document Upload</span></div>}
              </div>
            </div>
          )}

          {/* Detailed Permit Types */}
          {office.permit_types_available && office.permit_types_available.length > 0 && (
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Specific Permit Types Available</h4>
              <div className="flex flex-wrap gap-2">
                {office.permit_types_available.map((type, index) => (
                  <span key={index} className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded">
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </Section>

      {/* Permit Fees */}
      {office.permit_fees && Object.keys(office.permit_fees).length > 0 && (
        <Section
          title="Permit Fees"
          sectionKey="fees"
          icon={DollarSign}
          badge={Object.keys(office.permit_fees).length}
        >
          <div className="space-y-4">
            {formatFeeData(office.permit_fees).map(({ category, fees }) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 capitalize">{category}</h4>
                <div className="space-y-2">
                  {fees.map((fee: PermitFee | string, index: number) => (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-gray-700">
                        {typeof fee === 'string' ? `${category} permit` : (fee.description || `${category} permit`)}
                      </span>
                      <span className="font-medium">
                        ${typeof fee === 'string' ? fee : (fee.amount || 'Contact office')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Application Instructions */}
      {office.instructions && Object.keys(office.instructions).length > 0 && (
        <Section
          title="Application Instructions"
          sectionKey="instructions"
          icon={FileText}
          badge={Object.keys(office.instructions).length}
        >
          <div className="space-y-4">
            {formatInstructions(office.instructions).map(({ type, content }) => (
              <div key={type} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">{type} Instructions</h4>
                <p className="text-gray-700 whitespace-pre-wrap">{content}</p>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Downloadable Applications */}
      {office.downloadable_applications && Object.keys(office.downloadable_applications).length > 0 && (
        <Section
          title="Downloadable Applications"
          sectionKey="applications"
          icon={Download}
          badge={Object.values(office.downloadable_applications).flat().length}
        >
          <div className="space-y-4">
            {formatApplications(office.downloadable_applications).map(({ category, links }) => (
              <div key={category} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 capitalize">{category} Applications</h4>
                <div className="space-y-2">
                  {links.map((link: DownloadableApplication | string, index: number) => (
                    <a
                      key={index}
                      href={typeof link === 'string' ? link : link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-2 text-blue-600 hover:underline"
                    >
                      <Download className="h-4 w-4" />
                      <span>
                        {typeof link === 'string'
                          ? `Download ${category} application`
                          : link.name || `Download ${category} application`
                        }
                      </span>
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Processing Times */}
      {office.processing_times && Object.keys(office.processing_times).length > 0 && (
        <Section
          title="Processing Times"
          sectionKey="processing"
          icon={Clock}
          badge={Object.keys(office.processing_times).length}
        >
          <div className="space-y-4">
            {formatProcessingTimes(office.processing_times).map(({ type, times }) => (
              <div key={type} className="border rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2 capitalize">{type} Processing</h4>
                <div className="space-y-2">
                  {times.map((time: ProcessingTime | string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      <span className="text-gray-700">
                        {typeof time === 'string'
                          ? time
                          : time.description || `${time.min}-${time.max} ${time.unit}` || `Processing time varies`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Staff Directory */}
      {(office.staff_directory && office.staff_directory.length > 0) ||
       (office.department_divisions && office.department_divisions.length > 0) && (
        <Section
          title="Staff & Departments"
          sectionKey="staff"
          icon={Users}
          badge={(office.staff_directory?.length || 0) + (office.department_divisions?.length || 0)}
        >
          <div className="space-y-4">
            {office.department_divisions && office.department_divisions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Departments</h4>
                <div className="flex flex-wrap gap-2">
                  {office.department_divisions.map((dept, index) => (
                    <span key={index} className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded">
                      {dept}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {office.staff_directory && office.staff_directory.length > 0 && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Staff Contacts</h4>
                <div className="space-y-2">
                  {office.staff_directory.map((staff, index) => (
                    <div key={index} className="text-gray-700">
                      {staff}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {office.service_area_description && (
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-2">Service Area</h4>
                <p className="text-gray-700">{office.service_area_description}</p>
              </div>
            )}
          </div>
        </Section>
      )}

      {/* Additional Information */}
      {office.related_pages && office.related_pages.length > 0 && (
        <Section
          title="Related Resources"
          sectionKey="additional"
          icon={ExternalLink}
          badge={office.related_pages.length}
        >
          <div className="space-y-2">
            {office.related_pages.map((page, index) => (
              <a
                key={index}
                href={page.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
              >
                <span className="text-blue-600">{page.title}</span>
                <ExternalLink className="h-4 w-4 text-gray-400" />
              </a>
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}