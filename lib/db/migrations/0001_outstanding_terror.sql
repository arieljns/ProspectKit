CREATE TABLE IF NOT EXISTS "companies" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"company_name" text NOT NULL,
	"industry" text,
	"size" text,
	"priority" text DEFAULT 'Low' NOT NULL,
	"report_status" text DEFAULT 'none' NOT NULL,
	"website" text,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "company_reports" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"company_id" varchar(191) NOT NULL,
	"report_data" jsonb NOT NULL,
	"status" text DEFAULT 'generating' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "contacts" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"company_id" varchar(191) NOT NULL,
	"name" text NOT NULL,
	"title" text NOT NULL,
	"department" text,
	"linkedin_url" text,
	"contact_status" text DEFAULT 'new' NOT NULL,
	"priority" text DEFAULT 'Low' NOT NULL,
	"last_contacted_at" timestamp,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "lead_scores" (
	"id" varchar(191) PRIMARY KEY NOT NULL,
	"contact_id" varchar(191) NOT NULL,
	"industry_match_score" integer NOT NULL,
	"company_match_score" integer NOT NULL,
	"position_match_score" integer NOT NULL,
	"seniority_match_score" integer NOT NULL,
	"deal_size_score" integer NOT NULL,
	"reasoning" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "lead_scores_contact_id_unique" UNIQUE("contact_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "scoring_config" (
	"id" text PRIMARY KEY DEFAULT 'default' NOT NULL,
	"user_company_name" text NOT NULL,
	"user_company_description" text NOT NULL,
	"product_description" text NOT NULL,
	"target_industries" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"target_seniority_levels" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"weights" jsonb DEFAULT '{"industryMatch": 25, "companyMatch": 30, "positionMatch": 20, "seniorityMatch": 15, "dealSizeMatch": 10}'::jsonb NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "company_reports" ADD CONSTRAINT "company_reports_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "contacts" ADD CONSTRAINT "contacts_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "lead_scores" ADD CONSTRAINT "lead_scores_contact_id_contacts_id_fk" FOREIGN KEY ("contact_id") REFERENCES "public"."contacts"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DROP TABLE IF EXISTS "resources";
