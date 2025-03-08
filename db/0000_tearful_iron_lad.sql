CREATE SCHEMA IF NOT EXISTS "authentication";

DO $$
BEGIN
  CREATE TYPE "public"."agreement_type" AS ENUM('old', 'new');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "agreements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"type_of_agreement" "agreement_type" NOT NULL,
	"old_agreement_sent" boolean DEFAULT false,
	"old_agreement_date_signed" timestamp with time zone,
	"old_agreement_date_shared" timestamp with time zone,
	"old_agreement_link_to_agreement" text,
	"old_agreement_link_to_appendix" text,
	"new_agreement_sent" boolean DEFAULT false,
	"new_agreement_date_signed" timestamp with time zone,
	"new_agreement_date_shared" timestamp with time zone,
	"new_agreement_link_to_agreement" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "companies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"code" text NOT NULL,
	"status_id" integer NOT NULL,
	"consultations" smallint[] DEFAULT ARRAY[]::smallint[],
	"email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "companies_name_unique" UNIQUE("name"),
	CONSTRAINT "companies_code_unique" UNIQUE("code"),
	CONSTRAINT "companies_email_unique" UNIQUE("email")
);

CREATE TABLE IF NOT EXISTS "general_information" (
	"company_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"inhabitants" integer,
	"land_surface" numeric(10, 2),
	"cleaning_cost" integer,
	"cleaned_kg" integer,
	"epa_litter_measurement" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "general_information_company_id_year_pk" PRIMARY KEY("company_id","year")
);

CREATE TABLE IF NOT EXISTS "initial_consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"company_id" uuid NOT NULL,
	"document_sent" boolean DEFAULT false,
	"date_signed" timestamp with time zone,
	"date_shared" timestamp with time zone,
	"link" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "invoicing" (
	"company_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"invoice_date" timestamp with time zone,
	"date_paid" timestamp with time zone,
	"invoice_amount" numeric(10, 2),
	"vat" numeric(10, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "invoicing_company_id_year_pk" PRIMARY KEY("company_id","year")
);

CREATE TABLE IF NOT EXISTS "logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text NOT NULL,
	"company_id" uuid,
	"date" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);

CREATE TABLE IF NOT EXISTS "recurring_consultations" (
	"company_id" uuid,
	"year" smallint NOT NULL,
	"sent_date" timestamp with time zone,
	"meeting_date" timestamp with time zone,
	"consultation_form_completed" boolean,
	"meeting_held" boolean,
	"date_shared_with_authority" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "recurring_consultations_company_id_year_pk" PRIMARY KEY("company_id","year")
);

CREATE TABLE IF NOT EXISTS "reporting" (
	"company_id" uuid NOT NULL,
	"year" smallint NOT NULL,
	"reporting_date" timestamp with time zone,
	"cigarette_butts" numeric(10, 2),
	"motivation" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "reporting_company_id_year_pk" PRIMARY KEY("company_id","year")
);

CREATE TABLE IF NOT EXISTS "responsibles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text,
	"email" text,
	"phone_number" text,
	"title" text,
	"company_id" uuid
);

CREATE TABLE IF NOT EXISTS "authentication"."sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);

CREATE TABLE IF NOT EXISTS "statuses" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "statuses_name_unique" UNIQUE("name")
);

CREATE TABLE IF NOT EXISTS "authentication"."users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"password" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);

CREATE TABLE IF NOT EXISTS "years" (
	"name" smallint PRIMARY KEY NOT NULL,
	"change_factor" numeric DEFAULT 1,
	"change_factor_litter" numeric DEFAULT 1,
	"sek_admin" numeric DEFAULT 0.735147372938808,
	"admin_fee" integer DEFAULT 8904,
	"addition_1" integer DEFAULT 890,
	"addition_2" integer DEFAULT 445,
	"addition_3" integer DEFAULT 65,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "years_name_unique" UNIQUE("name")
);


ALTER TABLE "agreements" DROP CONSTRAINT IF EXISTS "agreements_company_id_companies_id_fk";
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_status_id_statuses_id_fk";
ALTER TABLE "general_information" DROP CONSTRAINT IF EXISTS "general_information_company_id_companies_id_fk";
ALTER TABLE "general_information" DROP CONSTRAINT IF EXISTS "general_information_year_years_name_fk";
ALTER TABLE "initial_consultations" DROP CONSTRAINT IF EXISTS "initial_consultations_company_id_companies_id_fk";
ALTER TABLE "invoicing" DROP CONSTRAINT IF EXISTS "invoicing_company_id_companies_id_fk";
ALTER TABLE "invoicing" DROP CONSTRAINT IF EXISTS "invoicing_year_years_name_fk";
ALTER TABLE "logs" DROP CONSTRAINT IF EXISTS "logs_company_id_companies_id_fk";
ALTER TABLE "recurring_consultations" DROP CONSTRAINT IF EXISTS "recurring_consultations_year_years_name_fk";
ALTER TABLE "reporting" DROP CONSTRAINT IF EXISTS "reporting_company_id_companies_id_fk";
ALTER TABLE "reporting" DROP CONSTRAINT IF EXISTS "reporting_year_years_name_fk";
ALTER TABLE "responsibles" DROP CONSTRAINT IF EXISTS "responsibles_company_id_companies_id_fk";
ALTER TABLE "authentication"."sessions" DROP CONSTRAINT IF EXISTS "sessions_user_id_users_id_fk";

ALTER TABLE "agreements" ADD CONSTRAINT "agreements_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "companies" ADD CONSTRAINT  "companies_status_id_statuses_id_fk" FOREIGN KEY ("status_id") REFERENCES "public"."statuses"("id") ON DELETE set null ON UPDATE no action;
ALTER TABLE "general_information" ADD CONSTRAINT "general_information_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "general_information" ADD CONSTRAINT  "general_information_year_years_name_fk" FOREIGN KEY ("year") REFERENCES "public"."years"("name") ON DELETE no action ON UPDATE no action;
ALTER TABLE "initial_consultations" ADD CONSTRAINT  "initial_consultations_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoicing" ADD CONSTRAINT "invoicing_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "invoicing" ADD CONSTRAINT  "invoicing_year_years_name_fk" FOREIGN KEY ("year") REFERENCES "public"."years"("name") ON DELETE no action ON UPDATE no action;
ALTER TABLE "logs" ADD CONSTRAINT "logs_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "recurring_consultations" ADD CONSTRAINT "recurring_consultations_year_years_name_fk" FOREIGN KEY ("year") REFERENCES "public"."years"("name") ON DELETE no action ON UPDATE no action;
ALTER TABLE "reporting" ADD CONSTRAINT "reporting_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "reporting" ADD CONSTRAINT "reporting_year_years_name_fk" FOREIGN KEY ("year") REFERENCES "public"."years"("name") ON DELETE no action ON UPDATE no action;
ALTER TABLE "responsibles" ADD CONSTRAINT  "responsibles_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;
ALTER TABLE "authentication"."sessions" ADD CONSTRAINT  "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "authentication"."users"("id") ON DELETE no action ON UPDATE no action;
CREATE MATERIALIZED VIEW IF NOT EXISTS "public"."compensation_view" AS (
WITH
	info AS (
		SELECT
			"general_information"."company_id",
			"general_information"."land_surface",
			"general_information"."land_surface" * 1000000 AS land_surface_km,
			g.inhabitants,
			general_information.year
		FROM
			"general_information"
			LEFT JOIN general_information AS g ON "general_information".company_id = g.company_id
		WHERE
			g."year" = general_information."year" - 1
	),
	calculated AS (
		SELECT
			company_id,
			inhabitants,
			land_surface_km,
			ROUND(SQRT((2 * (land_surface_km / inhabitants)) / SQRT(3))) AS inhabitants_per_meter,
			years.admin_fee AS admin_komun,
			years.addition_1 AS compensation_1,
			years.addition_2 AS compensation_2,
			years.addition_3 AS compensation_3,
			years.sek_admin AS sek_admin,
			info.year
		FROM
			info
			LEFT JOIN "years" ON info.year = years."name"
	),
	compensation AS (
		SELECT
			calculated.year AS "year",
			company_id,
			inhabitants,
			land_surface_km,
			inhabitants_per_meter,
			ROUND(sek_admin * inhabitants) AS variable_compensation,
			admin_komun,
			CASE
				WHEN inhabitants < 8000
				AND inhabitants_per_meter > 350 THEN compensation_1
				ELSE 0
			END AS calculation_1,
			CASE
				WHEN inhabitants_per_meter > 350
				AND inhabitants >= 8000
				AND inhabitants < 25000 THEN compensation_2
				ELSE 0
			END AS calculation_2,
			CASE
				WHEN inhabitants_per_meter < 350
				AND inhabitants < 8000 THEN compensation_3
				ELSE 0
			END AS calculation_3
		FROM
			calculated
	),
	totalval AS (
		SELECT
			compensation.year AS "year",
			company_id,
			variable_compensation,
			calculation_1 + calculation_2 + calculation_3 AS total_addition,
			calculation_1 + calculation_2 + calculation_3 + variable_compensation + admin_komun AS total_compensation,
			inhabitants
		FROM
			compensation
	)
SELECT
	totalval.year,
	"totalval".company_id AS id,
	"companies"."name" AS company_name,
	"agreements"."type_of_agreement" AS type_of_agreement,
	inhabitants,
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL
		OR "agreements"."old_agreement_date_signed" IS NOT NULL THEN TRUE
		ELSE FALSE
	END AS in_agreement,
	variable_compensation,
	total_addition,
	"years"."change_factor" AS change_factor,
	"years"."change_factor_litter" AS change_factor_litter,
	ROUND("years"."change_factor" * total_compensation) AS total_compensation_new,
	ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter") AS total_compensation_old,
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN ROUND("years"."change_factor" * total_compensation)
		ELSE ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter")
	END AS total_compensation
FROM
	totalval
	LEFT JOIN "agreements" ON "agreements"."company_id" = totalval.company_id
	LEFT JOIN "companies" ON "companies"."id" = totalval.company_id
	LEFT JOIN "years" ON years."name" = totalval.year);
