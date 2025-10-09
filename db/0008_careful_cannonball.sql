ALTER TABLE "responsibles" ADD COLUMN "updated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "responsibles" ADD COLUMN "created_at" timestamp with time zone DEFAULT now() NOT NULL;