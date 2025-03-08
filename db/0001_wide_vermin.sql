ALTER TABLE "companies" ADD COLUMN IF NOT EXISTS "responsible_id" INTEGER REFERENCES "authentication"."users"("id");
ALTER TABLE "companies" DROP CONSTRAINT IF EXISTS "companies_responsible_id_users_id_fk";
ALTER TABLE "companies" ADD CONSTRAINT "companies_responsible_id_users_id_fk" FOREIGN KEY ("responsible_id") REFERENCES "authentication"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
