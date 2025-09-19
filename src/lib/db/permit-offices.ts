import { and, eq } from 'drizzle-orm'
import { db, permitOffices } from './index'
import type { PermitOffice } from '@/lib/permit-office-search'

export async function upsertPermitOffice(office: PermitOffice): Promise<void> {
  const normalizedCity = office.city.trim()
  const normalizedCounty = office.county.trim()
  const department = office.department_name.trim()

  const existing = await db
    .select({ id: permitOffices.id })
    .from(permitOffices)
    .where(
      and(
        eq(permitOffices.city, normalizedCity),
        eq(permitOffices.county, normalizedCounty),
        eq(permitOffices.departmentName, department)
      )
    )
    .limit(1)

  const now = new Date()
  const createdAt = office.created_at ? new Date(office.created_at) : now
  const updatedAt = office.updated_at ? new Date(office.updated_at) : now

  const payload = {
    city: normalizedCity,
    county: normalizedCounty,
    state: office.state,
    jurisdictionType: office.jurisdiction_type,
    departmentName: department,
    officeType: office.office_type,
    address: office.address,
    phone: office.phone,
    email: office.email,
    website: office.website,
    hoursMonday: office.hours_monday,
    hoursTuesday: office.hours_tuesday,
    hoursWednesday: office.hours_wednesday,
    hoursThursday: office.hours_thursday,
    hoursFriday: office.hours_friday,
    hoursSaturday: office.hours_saturday,
    hoursSunday: office.hours_sunday,
    buildingPermits: office.building_permits,
    electricalPermits: office.electrical_permits,
    plumbingPermits: office.plumbing_permits,
    mechanicalPermits: office.mechanical_permits,
    zoningPermits: office.zoning_permits,
    planningReview: office.planning_review,
    inspections: office.inspections,
    onlineApplications: office.online_applications,
    onlinePayments: office.online_payments,
    permitTracking: office.permit_tracking,
    onlinePortalUrl: office.online_portal_url,
    latitude: office.latitude != null ? office.latitude.toString() : null,
    longitude: office.longitude != null ? office.longitude.toString() : null,
    serviceAreaBounds: office.service_area_bounds,
    dataSource: office.data_source,
    lastVerified: office.last_verified ? new Date(office.last_verified) : null,
    crawlFrequency: office.crawl_frequency,
    active: office.active,
    updatedAt: updatedAt,
    createdAt: createdAt
  }

  if (existing.length > 0) {
    await db
      .update(permitOffices)
      .set(payload)
      .where(eq(permitOffices.id, existing[0].id))
  } else {
    await db
      .insert(permitOffices)
      .values({ id: office.id, ...payload })
  }
}
