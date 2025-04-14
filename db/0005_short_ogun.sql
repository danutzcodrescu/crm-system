DO $$
BEGIN
  CREATE TYPE "public"."working_category" AS ENUM('wave 1', 'wave 2', 'wave 3');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS  "manual_consultation" boolean;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS  "declined_agreement" boolean;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS  "working_category" "working_category";--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS  "wave" text;--> statement-breakpoint
ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS  "info_verified" timestamp with time zone;--> statement-breakpoint
