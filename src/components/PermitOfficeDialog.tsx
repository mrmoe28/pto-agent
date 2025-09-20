'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { MapPin, Phone, Mail, Globe, Clock, CheckCircle, XCircle } from 'lucide-react'

interface PermitOffice {
  id?: string
  city: string
  county: string
  state: string
  jurisdiction_type: string
  department_name: string
  office_type: string
  address: string
  phone: string | null
  email: string | null
  website: string | null
  hours_monday?: string | null
  hours_tuesday?: string | null
  hours_wednesday?: string | null
  hours_thursday?: string | null
  hours_friday?: string | null
  hours_saturday?: string | null
  hours_sunday?: string | null
  building_permits?: boolean
  electrical_permits?: boolean
  plumbing_permits?: boolean
  mechanical_permits?: boolean
  zoning_permits?: boolean
  planning_review?: boolean
  inspections?: boolean
  online_applications?: boolean
  online_payments?: boolean
  permit_tracking?: boolean
  online_portal_url?: string | null
  latitude?: string | number | null
  longitude?: string | number | null
  distance?: number
}

interface PermitOfficeDialogProps {
  office: PermitOffice
  trigger?: React.ReactNode
}

export default function PermitOfficeDialog({ office, trigger }: PermitOfficeDialogProps) {
  const [isOpen, setIsOpen] = useState(false)

  const formatHours = (day: string, hours: string | null | undefined) => {
    if (!hours) return null
    return (
      <div className="flex justify-between text-sm">
        <span className="font-medium capitalize">{day}</span>
        <span className="text-muted-foreground">{hours}</span>
      </div>
    )
  }

  const getServiceIcon = (available: boolean | undefined) => {
    return available ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-gray-400" />
    )
  }

  const services = [
    { name: 'Building Permits', available: office.building_permits },
    { name: 'Electrical Permits', available: office.electrical_permits },
    { name: 'Plumbing Permits', available: office.plumbing_permits },
    { name: 'Mechanical Permits', available: office.mechanical_permits },
    { name: 'Zoning Permits', available: office.zoning_permits },
    { name: 'Planning Review', available: office.planning_review },
    { name: 'Inspections', available: office.inspections },
  ]

  const onlineServices = [
    { name: 'Online Applications', available: office.online_applications },
    { name: 'Online Payments', available: office.online_payments },
    { name: 'Permit Tracking', available: office.permit_tracking },
  ]

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm">
            View Details
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            {office.department_name}
          </DialogTitle>
          <DialogDescription className="text-base">
            {office.jurisdiction_type.charAt(0).toUpperCase() + office.jurisdiction_type.slice(1)} • {office.city}, {office.state}
            {office.distance && (
              <span className="ml-2 text-blue-600">
                • {office.distance.toFixed(1)} miles away
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <p className="font-medium">Address</p>
                <p className="text-sm text-muted-foreground">{office.address}</p>
              </div>
              
              {office.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`tel:${office.phone}`}
                    className="text-blue-600 hover:underline"
                  >
                    {office.phone}
                  </a>
                </div>
              )}
              
              {office.email && (
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={`mailto:${office.email}`}
                    className="text-blue-600 hover:underline"
                  >
                    {office.email}
                  </a>
                </div>
              )}
              
              {office.website && (
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <a 
                    href={office.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    Visit Website
                  </a>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operating Hours */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Operating Hours
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {formatHours('Monday', office.hours_monday)}
              {formatHours('Tuesday', office.hours_tuesday)}
              {formatHours('Wednesday', office.hours_wednesday)}
              {formatHours('Thursday', office.hours_thursday)}
              {formatHours('Friday', office.hours_friday)}
              {formatHours('Saturday', office.hours_saturday)}
              {formatHours('Sunday', office.hours_sunday)}
            </CardContent>
          </Card>
        </div>

        <Separator />

        {/* Services Offered */}
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-4">Services Offered</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {services.map((service) => (
                <div key={service.name} className="flex items-center gap-3">
                  {getServiceIcon(service.available)}
                  <span className="text-sm">{service.name}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-lg font-semibold mb-4">Online Services</h3>
            <div className="grid gap-3 md:grid-cols-2">
              {onlineServices.map((service) => (
                <div key={service.name} className="flex items-center gap-3">
                  {getServiceIcon(service.available)}
                  <span className="text-sm">{service.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {office.online_portal_url && (
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-blue-900 mb-2">Online Portal</h4>
            <p className="text-sm text-blue-700 mb-3">
              Access the online portal to submit applications, make payments, and track permits.
            </p>
            <Button asChild>
              <a 
                href={office.online_portal_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Portal
              </a>
            </Button>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Close
          </Button>
          {office.website && (
            <Button asChild>
              <a 
                href={office.website}
                target="_blank"
                rel="noopener noreferrer"
              >
                Visit Website
              </a>
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
