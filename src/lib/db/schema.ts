import { pgTable, text, timestamp, uuid, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// User profile and application-specific tables (using Clerk user IDs)
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').unique().notNull(), // Clerk user ID (string)
  firstName: text('first_name'),
  lastName: text('last_name'),
  bio: text('bio'),
  phone: text('phone'),
  address: text('address'),
  city: text('city'),
  state: text('state'),
  zipCode: text('zip_code'),
  preferences: jsonb('preferences').$type<{
    notifications?: boolean;
    theme?: 'light' | 'dark';
    emailUpdates?: boolean;
  }>().default({}),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const userPermitSearches = pgTable('user_permit_searches', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID (string)
  searchName: text('search_name'),
  searchQuery: text('search_query'),
  locationData: jsonb('location_data').$type<{
    address?: string;
    city?: string;
    county?: string;
    state?: string;
    lat?: number;
    lng?: number;
  }>(),
  resultsCount: integer('results_count').default(0),
  savedAt: timestamp('saved_at', { mode: 'date' }).defaultNow(),
  lastAccessed: timestamp('last_accessed', { mode: 'date' }).defaultNow(),
});

export const userFavorites = pgTable('user_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull(), // Clerk user ID (string)
  permitOfficeId: uuid('permit_office_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').unique().notNull(), // Clerk user ID (string)
  plan: text('plan').notNull().default('free'), // 'free', 'pro', 'enterprise'
  status: text('status').notNull().default('active'), // 'active', 'cancelled', 'expired'
  currentPeriodStart: timestamp('current_period_start', { mode: 'date' }).defaultNow(),
  currentPeriodEnd: timestamp('current_period_end', { mode: 'date' }),
  searchesUsed: integer('searches_used').default(0),
  searchesLimit: integer('searches_limit').default(1), // 1 for free, 40 for pro, null for enterprise
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

// Existing permit offices table (from your current schema)
export const permitOffices = pgTable('permit_offices', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
  city: text('city').notNull(),
  county: text('county').notNull(),
  state: text('state').notNull(),
  jurisdictionType: text('jurisdiction_type').notNull(),
  departmentName: text('department_name').notNull(),
  officeType: text('office_type').notNull(),
  address: text('address').notNull(),
  phone: text('phone'),
  email: text('email'),
  website: text('website'),
  // Operating hours
  hoursMonday: text('hours_monday'),
  hoursTuesday: text('hours_tuesday'),
  hoursWednesday: text('hours_wednesday'),
  hoursThursday: text('hours_thursday'),
  hoursFriday: text('hours_friday'),
  hoursSaturday: text('hours_saturday'),
  hoursSunday: text('hours_sunday'),
  // Services
  buildingPermits: boolean('building_permits').default(false),
  electricalPermits: boolean('electrical_permits').default(false),
  plumbingPermits: boolean('plumbing_permits').default(false),
  mechanicalPermits: boolean('mechanical_permits').default(false),
  zoningPermits: boolean('zoning_permits').default(false),
  planningReview: boolean('planning_review').default(false),
  inspections: boolean('inspections').default(false),
  // Online services
  onlineApplications: boolean('online_applications').default(false),
  onlinePayments: boolean('online_payments').default(false),
  permitTracking: boolean('permit_tracking').default(false),
  onlinePortalUrl: text('online_portal_url'),
  // Enhanced information
  permitFees: jsonb('permit_fees').$type<{
    building?: { amount?: number; description?: string; unit?: string };
    electrical?: { amount?: number; description?: string; unit?: string };
    plumbing?: { amount?: number; description?: string; unit?: string };
    mechanical?: { amount?: number; description?: string; unit?: string };
    zoning?: { amount?: number; description?: string; unit?: string };
    general?: { amount?: number; description?: string; unit?: string };
  }>(),
  instructions: jsonb('instructions').$type<{
    general?: string;
    building?: string;
    electrical?: string;
    plumbing?: string;
    mechanical?: string;
    zoning?: string;
    requiredDocuments?: string[];
    applicationProcess?: string;
  }>(),
  downloadableApplications: jsonb('downloadable_applications').$type<{
    building?: string[];
    electrical?: string[];
    plumbing?: string[];
    mechanical?: string[];
    zoning?: string[];
    general?: string[];
  }>(),
  processingTimes: jsonb('processing_times').$type<{
    building?: { min?: number; max?: number; unit?: string; description?: string };
    electrical?: { min?: number; max?: number; unit?: string; description?: string };
    plumbing?: { min?: number; max?: number; unit?: string; description?: string };
    mechanical?: { min?: number; max?: number; unit?: string; description?: string };
    zoning?: { min?: number; max?: number; unit?: string; description?: string };
    general?: { min?: number; max?: number; unit?: string; description?: string };
  }>(),
  // Geographic data
  latitude: text('latitude'),
  longitude: text('longitude'),
  serviceAreaBounds: jsonb('service_area_bounds'),
  // Metadata
  dataSource: text('data_source').default('manual'),
  lastVerified: timestamp('last_verified', { mode: 'date' }),
  crawlFrequency: text('crawl_frequency').default('monthly'),
  active: boolean('active').default(true),
});

// Type exports for TypeScript
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserPermitSearch = typeof userPermitSearches.$inferSelect;
export type NewUserPermitSearch = typeof userPermitSearches.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type NewUserSubscription = typeof userSubscriptions.$inferInsert;
export type PermitOffice = typeof permitOffices.$inferSelect;
export type NewPermitOffice = typeof permitOffices.$inferInsert;