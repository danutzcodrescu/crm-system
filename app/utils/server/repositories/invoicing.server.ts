import { and, asc, eq, gte, lte, sql } from 'drizzle-orm';

import { logger } from '../logger.server';
import { agreement, compensationView, invoicing, reporting, years } from '../schema.server';
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
  entitled: boolean;
  invoiceInfoSent: Date | null;
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
        invoiceInfoSent: invoicing.invoiceInfoSent,
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
        totalCompensation: compensationView.totalCompensation,
        inAgreement: sql<boolean>`CASE WHEN agreements.new_agreement_date_signed IS NOT NULL OR agreements.old_agreement_date_signed IS NOT NULL THEN TRUE ELSE FALSE END`,
        entitled: sql<boolean>`CASE
		WHEN (
			(
				agreements.new_agreement_date_signed IS NOT NULL
				AND invoicing.year < EXTRACT(
					YEAR
					FROM
						agreements.new_agreement_date_signed
				)
			)
			OR (
				agreements.old_agreement_date_signed IS NOT NULL
				AND invoicing.year < EXTRACT(
					YEAR
					FROM
						agreements.old_agreement_date_signed
				)
			)
		) THEN TRUE
		WHEN agreements.new_agreement_date_signed IS NOT NULL
		AND invoicing."year" >= EXTRACT(
			YEAR
			FROM
				agreements.new_agreement_date_signed
		)
		AND reporting.reporting_date IS NOT NULL THEN TRUE
		WHEN agreements.old_agreement_date_signed IS NOT NULL
		AND invoicing."year" >= EXTRACT(
			YEAR
			FROM
				agreements.old_agreement_date_signed
		)
		AND reporting.reporting_date IS NOT NULL THEN TRUE
		ELSE FALSE
	END`,
      })
      .from(invoicing)
      .where(eq(invoicing.year, year))
      .leftJoin(compensationView, and(eq(invoicing.companyId, compensationView.id), eq(compensationView.year, year)))
      .leftJoin(agreement, eq(invoicing.companyId, agreement.companyId))
      .leftJoin(reporting, and(eq(invoicing.companyId, reporting.companyId), eq(reporting.year, year)))
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
        companyName: compensationView.companyName,
        year: invoicing.year,
        invoiceDate: invoicing.invoiceDate,
        datePaid: invoicing.datePaid,
        invoiceAmount: invoicing.invoiceAmount,
        invoiceInfoSent: invoicing.invoiceInfoSent,
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
		WHEN (
			agreements.new_agreement_date_signed IS NOT NULL
			AND invoicing.year < EXTRACT(
				YEAR
				FROM
					agreements.new_agreement_date_signed
			)
		) THEN compensation_view.total_compensation
		WHEN (
			agreements.old_agreement_date_signed IS NOT NULL
			AND invoicing.year < EXTRACT(
				YEAR
				FROM
					agreements.old_agreement_date_signed
			)
		) THEN compensation_view.total_compensation
		WHEN agreements.new_agreement_date_signed IS NOT NULL
		AND invoicing."year" >= EXTRACT(
			YEAR
			FROM
				agreements.new_agreement_date_signed
		)
		AND reporting.reporting_date IS NOT NULL THEN compensation_view.total_compensation
		WHEN agreements.old_agreement_date_signed IS NOT NULL
		AND invoicing."year" >= EXTRACT(
			YEAR
			FROM
				agreements.old_agreement_date_signed
		)
		AND reporting.reporting_date IS NOT NULL THEN compensation_view.total_compensation
		ELSE NULL
	END`,
      })
      .from(invoicing)
      .leftJoin(
        compensationView,
        and(eq(invoicing.companyId, compensationView.id), eq(invoicing.year, compensationView.year)),
      )
      .leftJoin(agreement, eq(invoicing.companyId, agreement.companyId))
      .leftJoin(years, eq(invoicing.year, years.name))
      .leftJoin(reporting, and(eq(reporting.companyId, invoicing.companyId), eq(reporting.year, invoicing.year)))
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
        invoiceInfoSent: args.invoiceInfoSent ? new Date(args.invoiceInfoSent) : null,
      })
      .onConflictDoUpdate({
        target: [invoicing.companyId, invoicing.year],
        set: {
          invoiceDate: args.invoiceDate ? new Date(args.invoiceDate) : null,
          datePaid: args.datePaid ? new Date(args.datePaid) : null,
          invoiceAmount: args.invoiceAmount,
          invoiceInfoSent: args.invoiceInfoSent ? new Date(args.invoiceInfoSent) : null,
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

export interface InvoicingAggregated {
  entitled: number;
  paid: number;
  invoiced: number;
  totalPaid: number;
  year: number;
}

export async function getInvoicingAggregatedPerYear(
  startYear: number,
  endYear: number,
): Promise<[null, InvoicingAggregated[]] | [string, null]> {
  try {
    logger.info('Getting aggregated invoicing per year');
    const data = await db
      .select({
        year: invoicing.year,
        entitled: sql<number>`COUNT(DISTINCT ${invoicing.companyId}) FILTER (
    WHERE ( ${invoicing.year} < EXTRACT(YEAR FROM ${agreement.oldAgreementDateSigned}))
    OR ( ${invoicing.year} < EXTRACT(YEAR FROM ${agreement.newAgreementDateSigned})) OR ( ${invoicing.year} >= EXTRACT(YEAR FROM ${agreement.newAgreementDateSigned}) AND ${reporting.reportingDate} IS NOT NULL)
    OR ( ${invoicing.year} >= EXTRACT(YEAR FROM ${agreement.oldAgreementDateSigned}) AND ${reporting.reportingDate} IS NOT NULL))`,
        paid: sql<number>`COUNT(DISTINCT ${invoicing.companyId}) FILTER (WHERE ${invoicing.datePaid} IS NOT NULL OR ${invoicing.invoiceAmount} IS NOT NULL)`,
        invoiced: sql<number>`COUNT(DISTINCT ${invoicing.companyId}) FILTER (WHERE ${invoicing.invoiceDate} IS NOT NULL OR ${invoicing.invoiceAmount} IS NOT NULL)`,
        totalPaid: sql<number>`COALESCE(SUM(${invoicing.invoiceAmount}), 0)`,
      })
      .from(invoicing)
      .leftJoin(agreement, eq(agreement.companyId, invoicing.companyId))
      .leftJoin(reporting, and(eq(reporting.companyId, invoicing.companyId), eq(reporting.year, invoicing.year)))
      .where(and(gte(invoicing.year, startYear), lte(invoicing.year, endYear)))
      .groupBy(invoicing.year);
    logger.info('Aggregated invoicing per year fetched');
    return [null, data as unknown as InvoicingAggregated[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch aggregated invoicing per year', null];
  }
}

export async function bulkImportInvoicing(values: (typeof invoicing.$inferInsert)[]): Promise<string | null> {
  try {
    await db
      .insert(invoicing)
      .values(values)
      .onConflictDoUpdate({
        target: [invoicing.companyId, invoicing.year],
        set: {
          invoiceDate: sql.raw(`excluded.invoice_date`),
          datePaid: sql.raw(`excluded.date_paid`),
          invoiceAmount: sql.raw(`excluded.invoice_amount`),
          vat: sql.raw(`excluded.vat`),
        },
      });
    return null;
  } catch (e) {
    logger.error(e);
    return 'could not import reporting data';
  }
}
