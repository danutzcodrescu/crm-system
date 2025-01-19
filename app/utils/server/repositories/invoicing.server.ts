import { sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { invoicing } from '../schema.server';
import { compensationQuery, compensationQueryFrom, compensationQueryOrderBy } from './compensation.server';
import { db } from './db.server';

export interface InvoicingData {
  id: string;
  companyName: string;
  year: number;
  invoiceDate: Date;
  datePaid: Date;
  invoiceAmount: number;
  invoiceReceived?: boolean;
  invoicePaid?: boolean;
  vat: number;
  totalCompensation: number;
  inAgreement: boolean;
}

export async function getInvoicingDataByYear(year: number): Promise<[null, InvoicingData[]] | [string, null]> {
  try {
    logger.info('Getting invoicing data');
    const query = compensationQuery(year)
      .append(
        sql`totalval.company_id AS id,
	"companies"."name" AS "companyName",
	companies.code,
	CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN ROUND("years"."change_factor" * total_compensation)
		ELSE ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter")
	END AS "totalCompensation",
	CASE
		WHEN (
			agreements.new_agreement_date_signed IS NOT NULL
			AND agreements.new_agreement_date_signed <= `,
      )
      .append(year === 2023 ? sql`'2024-12-31'` : sql`TO_DATE(${year + 1}  || '-02-15', 'YYYY-MM-DD')`)
      .append(
        sql`) OR (
			agreements.old_agreement_date_signed IS NOT NULL
			AND agreements.old_agreement_date_signed <= `,
      )
      .append(year === 2023 ? sql`'2024-12-31'` : sql`TO_DATE(${year + 1}  || '-02-15', 'YYYY-MM-DD')`)
      .append(
        sql`) THEN TRUE
		ELSE FALSE
	END AS "inAgreement",
	invoicing.invoice_date as "invoiceDate",
	invoicing.date_paid as "datePaid",
	invoicing.invoice_amount as "invoiceAmount",
	invoicing.vat as "vat",
  years.name as "year",
	CASE
		WHEN invoicing.invoice_date IS NOT NULL
		OR invoicing.invoice_amount IS NOT NULL THEN TRUE
		ELSE FALSE
	END AS "invoiceReceived",
	CASE
		WHEN invoicing.date_paid IS NOT NULL
		OR invoicing.invoice_amount IS NOT NULL THEN TRUE
		ELSE FALSE
	END AS "invoicePaid"`,
      )
      .append(compensationQueryFrom(year))
      .append(sql` LEFT JOIN invoicing ON invoicing.company_id = totalval.company_id AND invoicing.year = ${year}`)
      .append(compensationQueryOrderBy);
    const data = await db.execute(query);
    logger.info('Invoicing data fetched');
    return [null, data.rows as unknown as InvoicingData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch invoicing data', null];
  }
}

export async function editInvoicingRecord(
  args: typeof invoicing.$inferInsert,
): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Trying to update invoicing data for: ', args.companyId, ' and year: ', args.year);
    await db
      .insert(invoicing)
      .values({
        ...args,
        invoiceDate: args.invoiceDate ? new Date(args.invoiceDate) : null,
        datePaid: args.datePaid ? new Date(args.datePaid) : null,
      })
      .onConflictDoUpdate({
        target: [invoicing.companyId, invoicing.year],
        set: {
          invoiceDate: args.invoiceDate ? new Date(args.invoiceDate) : null,
          datePaid: args.datePaid ? new Date(args.datePaid) : null,
          invoiceAmount: args.invoiceAmount,
          vat: args.vat,
        },
      });
    logger.info('Invoicing data edited succesfully');
    return [null, ''];
  } catch (e) {
    console.log(e);
    logger.error(e);
    return ['could not edit invoicing data', null];
  }
}
