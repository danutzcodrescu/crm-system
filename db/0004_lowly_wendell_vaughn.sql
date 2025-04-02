CREATE TABLE IF NOT EXISTS "reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"description" text,
	"company_id" uuid NOT NULL,
  "due_date" timestamp with time zone NOT NULL,
  "status": boolean DEFAULT false,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "logs" ADD COLUMN IF NOT EXISTS "reminder_id" uuid;--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "reminders_company_id_companies_id_fk";--> statement-breakpoint
ALTER TABLE "reminders" ADD CONSTRAINT "reminders_company_id_companies_id_fk" FOREIGN KEY ("company_id") REFERENCES "public"."companies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "logs_reminder_id_reminders_id_fk";--> statement-breakpoint
ALTER TABLE "logs" ADD CONSTRAINT "logs_reminder_id_reminders_id_fk" FOREIGN KEY ("reminder_id") REFERENCES "public"."reminders"("id") ON DELETE cascade ON UPDATE no action;
