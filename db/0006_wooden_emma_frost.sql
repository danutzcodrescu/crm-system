ALTER TABLE "agreements" ADD COLUMN IF NOT EXISTS "new_agreement_date_sent" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "initial_consultations" ADD COLUMN IF NOT EXISTS "document_date_sent" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "invoicing" ADD COLUMN IF NOT EXISTS "invoice_info_sent" timestamp with time zone;--> statement-breakpoint

ALTER TABLE "agreements" DROP COLUMN IF EXISTS "new_agreement_sent";--> statement-breakpoint
ALTER TABLE "initial_consultations" DROP COLUMN IF EXISTS "document_sent";
