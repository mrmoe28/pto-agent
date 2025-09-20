CREATE TABLE "permit_offices" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"city" text NOT NULL,
	"county" text NOT NULL,
	"state" text NOT NULL,
	"jurisdiction_type" text NOT NULL,
	"department_name" text NOT NULL,
	"office_type" text NOT NULL,
	"address" text NOT NULL,
	"phone" text,
	"email" text,
	"website" text,
	"hours_monday" text,
	"hours_tuesday" text,
	"hours_wednesday" text,
	"hours_thursday" text,
	"hours_friday" text,
	"hours_saturday" text,
	"hours_sunday" text,
	"building_permits" boolean DEFAULT false,
	"electrical_permits" boolean DEFAULT false,
	"plumbing_permits" boolean DEFAULT false,
	"mechanical_permits" boolean DEFAULT false,
	"zoning_permits" boolean DEFAULT false,
	"planning_review" boolean DEFAULT false,
	"inspections" boolean DEFAULT false,
	"online_applications" boolean DEFAULT false,
	"online_payments" boolean DEFAULT false,
	"permit_tracking" boolean DEFAULT false,
	"online_portal_url" text,
	"permit_fees" jsonb,
	"instructions" jsonb,
	"downloadable_applications" jsonb,
	"processing_times" jsonb,
	"latitude" text,
	"longitude" text,
	"service_area_bounds" jsonb,
	"data_source" text DEFAULT 'manual',
	"last_verified" timestamp,
	"crawl_frequency" text DEFAULT 'monthly',
	"active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "scrape_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"city" text NOT NULL,
	"county" text,
	"state" text NOT NULL,
	"latitude" text,
	"longitude" text,
	"status" text DEFAULT 'pending' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"last_error" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"completed_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "shared_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"permit_office_id" uuid NOT NULL,
	"added_by" text NOT NULL,
	"notes" text,
	"tags" text,
	"is_public" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_team_office" UNIQUE("team_id","permit_office_id")
);
--> statement-breakpoint
CREATE TABLE "shared_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"shared_by" text NOT NULL,
	"search_query" text NOT NULL,
	"search_results" jsonb NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"is_public" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_activity" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"action" text NOT NULL,
	"description" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "team_invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"email" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"invited_by" text NOT NULL,
	"token" text NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"expires_at" timestamp NOT NULL,
	"accepted_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "team_invitations_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"role" text DEFAULT 'member' NOT NULL,
	"status" text DEFAULT 'pending' NOT NULL,
	"invited_by" text,
	"joined_at" timestamp,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_team_user" UNIQUE("team_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"owner_id" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_favorites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"permit_office_id" uuid NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "unique_user_office" UNIQUE("user_id","permit_office_id")
);
--> statement-breakpoint
CREATE TABLE "user_permit_searches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"search_name" text,
	"search_query" text,
	"location_data" jsonb,
	"results_count" integer DEFAULT 0,
	"saved_at" timestamp DEFAULT now(),
	"last_accessed" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"first_name" text,
	"last_name" text,
	"bio" text,
	"phone" text,
	"address" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"preferences" jsonb DEFAULT '{}'::jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_profiles_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "user_subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"plan" text DEFAULT 'free' NOT NULL,
	"status" text DEFAULT 'active' NOT NULL,
	"current_period_start" timestamp DEFAULT now(),
	"current_period_end" timestamp,
	"searches_used" integer DEFAULT 0,
	"searches_limit" integer DEFAULT 1,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "user_subscriptions_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
ALTER TABLE "shared_favorites" ADD CONSTRAINT "shared_favorites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shared_searches" ADD CONSTRAINT "shared_searches_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_activity" ADD CONSTRAINT "team_activity_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invitations" ADD CONSTRAINT "team_invitations_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "scrape_jobs_location_idx" ON "scrape_jobs" USING btree ("state","city","county");--> statement-breakpoint
CREATE INDEX "scrape_jobs_status_idx" ON "scrape_jobs" USING btree ("status");--> statement-breakpoint
CREATE INDEX "shared_favorites_team_id_idx" ON "shared_favorites" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "shared_favorites_added_by_idx" ON "shared_favorites" USING btree ("added_by");--> statement-breakpoint
CREATE INDEX "shared_searches_team_id_idx" ON "shared_searches" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "shared_searches_shared_by_idx" ON "shared_searches" USING btree ("shared_by");--> statement-breakpoint
CREATE INDEX "team_activity_team_id_idx" ON "team_activity" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_activity_user_id_idx" ON "team_activity" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "team_activity_created_at_idx" ON "team_activity" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "team_invitations_team_id_idx" ON "team_invitations" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_invitations_email_idx" ON "team_invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "team_invitations_token_idx" ON "team_invitations" USING btree ("token");--> statement-breakpoint
CREATE INDEX "team_members_team_id_idx" ON "team_members" USING btree ("team_id");--> statement-breakpoint
CREATE INDEX "team_members_user_id_idx" ON "team_members" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "teams_owner_id_idx" ON "teams" USING btree ("owner_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_permit_office_id_idx" ON "user_favorites" USING btree ("permit_office_id");