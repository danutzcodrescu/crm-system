import { and, asc, eq, lte, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, compensationView, invoicing, years } from '../schema.server';
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

    const data = await db
      .select({
        id: invoicing.companyId,
        companyName: compensationView.companyName,
        year: invoicing.year,
        invoiceDate: invoicing.invoiceDate,
        datePaid: invoicing.datePaid,
        invoiceAmount: invoicing.invoiceAmount,
        invoiceReceived: sql<boolean>`CASE
		WHEN invoicing.invoice_date IS NOT NULL
		OR invoicing.invoice_amount IS NOT NULL THEN TRUE
		ELSE FALSE
	END`,
        invoicePaid: sql<boolean>`CASE
		WHEN invoicing.date_paid IS NOT NULL
		OR invoicing.invoice_amount IS NOT NULL THEN TRUE
		ELSE FALSE
	END `,
        vat: invoicing.vat,
        totalCompensation: sql<number>`CASE
		WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN ROUND("years"."change_factor" * total_compensation)
		ELSE ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter")
	END`,
        inAgreement: sql.join([
          sql`CASE
		WHEN (
			agreements.new_agreement_date_signed IS NOT NULL
			AND agreements.new_agreement_date_signed <= `,
          year === 2023 ? sql`'2024-12-31'` : sql`TO_DATE(${year + 1}  || '-02-15', 'YYYY-MM-DD')`,
          sql`) OR (
			agreements.old_agreement_date_signed IS NOT NULL
			AND agreements.old_agreement_date_signed <= `,
          year === 2023 ? sql`'2024-12-31'` : sql`TO_DATE(${year + 1}  || '-02-15', 'YYYY-MM-DD')`,
          sql`) THEN TRUE
		ELSE FALSE
	END`,
        ]),
      })
      .from(invoicing)
      .leftJoin(compensationView, and(eq(invoicing.companyId, compensationView.id), eq(compensationView.year, year)))
      .leftJoin(agreement, eq(invoicing.companyId, agreement.companyId))
      .leftJoin(years, eq(years.name, year))
      .orderBy(asc(compensationView.companyName));

    logger.info('Invoicing data fetched');
    return [null, data as unknown as InvoicingData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch invoicing data', null];
  }
}

export async function getInvoicingForCompany(
  companyId: string,
  limitYear: number,
): Promise<[null, InvoicingData[]] | [string, null]> {
  try {
    logger.info('Getting invoicing data for company:', companyId);
    const data = await db
      .select({
        id: invoicing.companyId,
        year: invoicing.year,
        invoiceDate: invoicing.invoiceDate,
        datePaid: invoicing.datePaid,
        invoiceAmount: invoicing.invoiceAmount,
        invoiceReceived: sql<boolean>`CASE
    WHEN invoicing.invoice_date IS NOT NULL
    OR invoicing.invoice_amount IS NOT NULL THEN TRUE
    ELSE FALSE
  END`,
        invoicePaid: sql<boolean>`CASE
    WHEN invoicing.date_paid IS NOT NULL
    OR invoicing.invoice_amount IS NOT NULL THEN TRUE
    ELSE FALSE
  END`,
        vat: invoicing.vat,
        totalCompensation: sql<number>`CASE
    WHEN "agreements"."new_agreement_date_signed" IS NOT NULL THEN ROUND("years"."change_factor" * total_compensation)
    ELSE ROUND("years"."change_factor" * total_compensation * "years"."change_factor_litter")
  END`,
      })
      .from(invoicing)
      .leftJoin(
        compensationView,
        and(eq(invoicing.companyId, compensationView.id), eq(invoicing.year, compensationView.year)),
      )
      .leftJoin(agreement, eq(invoicing.companyId, agreement.companyId))
      .leftJoin(years, eq(invoicing.year, years.name))
      .where(and(eq(invoicing.companyId, companyId), lte(invoicing.year, limitYear)))
      .orderBy(asc(invoicing.year));

    logger.info('Invoicing data fetched');
    return [null, data as InvoicingData[]];
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
    logger.error(e);
    return ['could not edit invoicing data', null];
  }
}
