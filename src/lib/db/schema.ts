import { pgTable, text, timestamp, uuid, boolean, integer, jsonb, unique, index } from 'drizzle-orm/pg-core';

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
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add unique constraint to prevent duplicate favorites
  uniqueUserOffice: unique('unique_user_office').on(table.userId, table.permitOfficeId),
  // Add indexes for better query performance
  userIdIdx: index('user_favorites_user_id_idx').on(table.userId),
  permitOfficeIdIdx: index('user_favorites_permit_office_id_idx').on(table.permitOfficeId),
}));

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

// Team collaboration tables
export const teams = pgTable('teams', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
  description: text('description'),
  ownerId: text('owner_id').notNull(), // Clerk user ID of team owner
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  ownerIdIdx: index('teams_owner_id_idx').on(table.ownerId),
}));

export const teamMembers = pgTable('team_members', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // Clerk user ID
  role: text('role').notNull().default('member'), // 'owner', 'admin', 'member'
  status: text('status').notNull().default('pending'), // 'pending', 'active', 'inactive'
  invitedBy: text('invited_by'), // Clerk user ID of who invited this member
  joinedAt: timestamp('joined_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add unique constraint to prevent duplicate team memberships
  uniqueTeamUser: unique('unique_team_user').on(table.teamId, table.userId),
  // Add indexes for better query performance
  teamIdIdx: index('team_members_team_id_idx').on(table.teamId),
  userIdIdx: index('team_members_user_id_idx').on(table.userId),
}));

export const teamInvitations = pgTable('team_invitations', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  email: text('email').notNull(),
  role: text('role').notNull().default('member'), // 'admin', 'member'
  invitedBy: text('invited_by').notNull(), // Clerk user ID
  token: text('token').notNull().unique(), // Unique invitation token
  status: text('status').notNull().default('pending'), // 'pending', 'accepted', 'expired', 'cancelled'
  expiresAt: timestamp('expires_at', { mode: 'date' }).notNull(),
  acceptedAt: timestamp('accepted_at', { mode: 'date' }),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add indexes for better query performance
  teamIdIdx: index('team_invitations_team_id_idx').on(table.teamId),
  emailIdx: index('team_invitations_email_idx').on(table.email),
  tokenIdx: index('team_invitations_token_idx').on(table.token),
}));

export const sharedSearches = pgTable('shared_searches', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  sharedBy: text('shared_by').notNull(), // Clerk user ID
  searchQuery: text('search_query').notNull(),
  searchResults: jsonb('search_results').notNull(), // Store the search results as JSON
  title: text('title').notNull(),
  description: text('description'),
  isPublic: boolean('is_public').default(false), // Whether search is visible to all team members
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add indexes for better query performance
  teamIdIdx: index('shared_searches_team_id_idx').on(table.teamId),
  sharedByIdx: index('shared_searches_shared_by_idx').on(table.sharedBy),
}));

export const sharedFavorites = pgTable('shared_favorites', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  permitOfficeId: uuid('permit_office_id').notNull(),
  addedBy: text('added_by').notNull(), // Clerk user ID
  notes: text('notes'),
  tags: text('tags'), // Comma-separated tags
  isPublic: boolean('is_public').default(true), // Whether favorite is visible to all team members
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add unique constraint to prevent duplicate shared favorites
  uniqueTeamOffice: unique('unique_team_office').on(table.teamId, table.permitOfficeId),
  // Add indexes for better query performance
  teamIdIdx: index('shared_favorites_team_id_idx').on(table.teamId),
  addedByIdx: index('shared_favorites_added_by_idx').on(table.addedBy),
}));

export const teamActivity = pgTable('team_activity', {
  id: uuid('id').defaultRandom().primaryKey(),
  teamId: uuid('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // Clerk user ID
  action: text('action').notNull(), // 'search', 'favorite', 'export', 'invite', 'join', 'leave'
  description: text('description').notNull(),
  metadata: jsonb('metadata'), // Additional data about the action
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow(),
}, (table) => ({
  // Add indexes for better query performance
  teamIdIdx: index('team_activity_team_id_idx').on(table.teamId),
  userIdIdx: index('team_activity_user_id_idx').on(table.userId),
  createdAtIdx: index('team_activity_created_at_idx').on(table.createdAt),
}));

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

// Team collaboration types
export type Team = typeof teams.$inferSelect;
export type NewTeam = typeof teams.$inferInsert;
export type TeamMember = typeof teamMembers.$inferSelect;
export type NewTeamMember = typeof teamMembers.$inferInsert;
export type TeamInvitation = typeof teamInvitations.$inferSelect;
export type NewTeamInvitation = typeof teamInvitations.$inferInsert;
export type SharedSearch = typeof sharedSearches.$inferSelect;
export type NewSharedSearch = typeof sharedSearches.$inferInsert;
export type SharedFavorite = typeof sharedFavorites.$inferSelect;
export type NewSharedFavorite = typeof sharedFavorites.$inferInsert;
export type TeamActivity = typeof teamActivity.$inferSelect;
export type NewTeamActivity = typeof teamActivity.$inferInsert;