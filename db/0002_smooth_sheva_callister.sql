DROP MATERIALIZED VIEW IF EXISTS "public"."compensation_view";--> statement-breakpoint

ALTER TABLE "years" ALTER COLUMN "addition_1" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "addition_1" SET DEFAULT '890';--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "addition_2" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "addition_2" SET DEFAULT '445';--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "addition_3" SET DATA TYPE numeric;--> statement-breakpoint
ALTER TABLE "years" ALTER COLUMN "addition_3" SET DEFAULT '65';

UPDATE "years" SET "addition_1" = 890.4, "addition_2" = 445.2, "addition_3" = 64.9992 WHERE "name" IN ('2023', '2024', '2022');--> statement-breakpoint


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
			sek_admin * inhabitants AS variable_compensation,
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
	"years"."change_factor" * total_compensation AS total_compensation_new,
	"years"."change_factor" * total_compensation * "years"."change_factor_litter" AS total_compensation_old,
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN ROUND("years"."change_factor" * total_compensation)
		ELSE ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter")
	END AS total_compensation
FROM
	totalval
	LEFT JOIN "agreements" ON "agreements"."company_id" = totalval.company_id
	LEFT JOIN "companies" ON "companies"."id" = totalval.company_id
	LEFT JOIN "years" ON years."name" = totalval.year);

REFRESH MATERIALIZED VIEW "public"."compensation_view";--> statement-breakpoint
