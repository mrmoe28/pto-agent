import { pgTable, text, timestamp, uuid, bigint, boolean, integer, jsonb } from 'drizzle-orm/pg-core';

// NextAuth required tables
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name'),
  email: text('email').unique().notNull(),
  emailVerified: timestamp('email_verified', { mode: 'date' }),
  image: text('image'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: text('type').notNull(),
  provider: text('provider').notNull(),
  providerAccountId: text('provider_account_id').notNull(),
  refresh_token: text('refresh_token'),
  access_token: text('access_token'),
  expires_at: bigint('expires_at', { mode: 'number' }),
  token_type: text('token_type'),
  scope: text('scope'),
  id_token: text('id_token'),
  session_state: text('session_state'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionToken: text('session_token').unique().notNull(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
});

export const verificationTokens = pgTable('verification_tokens', {
  identifier: text('identifier').notNull(),
  token: text('token').notNull(),
  expires: timestamp('expires', { mode: 'date' }).notNull(),
});

// User profile and application-specific tables
export const userProfiles = pgTable('user_profiles', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').unique().notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
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
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  permitOfficeId: uuid('permit_office_id').notNull(),
  notes: text('notes'),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
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
export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserProfile = typeof userProfiles.$inferSelect;
export type NewUserProfile = typeof userProfiles.$inferInsert;
export type UserPermitSearch = typeof userPermitSearches.$inferSelect;
export type NewUserPermitSearch = typeof userPermitSearches.$inferInsert;
export type UserFavorite = typeof userFavorites.$inferSelect;
export type NewUserFavorite = typeof userFavorites.$inferInsert;
export type PermitOffice = typeof permitOffices.$inferSelect;
export type NewPermitOffice = typeof permitOffices.$inferInsert;