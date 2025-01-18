import { sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { db } from './db.server';

export interface CompensationData {
  id: string;
  companyName: string;
  typeOfAgreement: 'new' | 'old';
  inAgreement: boolean;
  inhabitants: number;
  variableCompensation: number;
  additionalCompensation: number;
  changeFactor: number;
  changeFactorLitter: number;
  totalCompensationOld: number;
  totalCompensationNew: number;
  totalCompensation: number;
}

export async function getCompensationByYear(year: number): Promise<[null, CompensationData[]] | [string, null]> {
  try {
    logger.info('Getting compensation data');
    const data = await db.execute(sql`WITH
	info AS (
		SELECT
			"general_information"."company_id",
			"general_information"."land_surface",
			"general_information"."land_surface" * 1000000 AS land_surface_km,
			genInfo.inhabitants AS inhabitants
		FROM
			"general_information"
			LEFT JOIN general_information AS genInfo ON "general_information"."company_id" = genInfo.company_id
		WHERE
			"general_information"."year" = ${year}
			AND genInfo.year = ${year - 1}
	),
	calculated AS (
		SELECT
			company_id,
			inhabitants,
			land_surface_km,
			ROUND(SQRT((2 * (land_surface_km / inhabitants)) / SQRT(3))) AS inhabitants_per_meter,
			8904 AS admin_komun,
			890.4 AS compensation_1,
			445.2 AS compensation_2,
			64.9992 AS compensation_3
		FROM
			info
	),
	compensation AS (
		SELECT
			company_id,
			inhabitants,
			land_surface_km,
			inhabitants_per_meter,
			ROUND(0.735147372938808 * inhabitants) AS variable_compensation,
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
			company_id,
			variable_compensation,
			calculation_1 + calculation_2 + calculation_3 AS total_addition,
			calculation_1 + calculation_2 + calculation_3 + variable_compensation + admin_komun AS total_compensation,
			inhabitants
		FROM
			compensation
	)
SELECT
	totalval.company_id AS id,
	"companies"."name" AS "companyName",
	"agreements"."type_of_agreement" AS "typeOfAgreement",
	inhabitants,
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL
		OR "agreements"."old_agreement_date_signed" IS NOT NULL THEN TRUE
		ELSE FALSE
	END AS "inAgreement",
	variable_compensation AS "variableCompensation",
	total_addition AS "additionalCompensation",
	"years"."change_factor" AS "changeFactor",
	"years"."change_factor_litter" AS "changeFactorLitter",
	"years"."change_factor" * total_compensation AS "totalCompensationNew",
	"years"."change_factor" * total_compensation * "years"."change_factor_litter" AS "totalCompensationOld",
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN "years"."change_factor" * total_compensation
		ELSE "years"."change_factor" * total_compensation * "years"."change_factor_litter"
	END AS "totalCompensation"
FROM
	totalval
	LEFT JOIN "years" ON "years"."name" = 2024
	LEFT JOIN "agreements" ON "agreements"."company_id" = totalval.company_id
	LEFT JOIN "companies" ON "companies"."id" = totalval.company_id
ORDER BY
	"companyName"`);
    logger.info('Compensation data fetched');
    console.log(data.rows);
    return [null, data.rows as unknown as CompensationData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch compensation data', null];
  }
}
