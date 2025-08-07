import { asc, eq, InferInsertModel, sql } from 'drizzle-orm';
import { omit } from 'lodash-es';

import { logger } from '../logger.server';
import { agreement, companies, initialConsultation, responsibles, status, users } from '../schema.server';
import { db } from './db.server';

const processQuery = sql`SELECT
	c.id,
	c.name,
	initcap(c.working_category::text) AS "workingCategory",
	c.wave,
	ic.document_date_sent AS "initialConsultationDateSent",
	(
		CASE
			WHEN ic.document_date_sent IS NOT NULL
			OR ic.date_signed IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isInitialConsultationDocumentSent",
	ic.date_signed AS "initialConsultationDateSigned",
	(
		CASE
			WHEN ic.date_signed IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isInitialConsultationSigned",
	(
		CASE
			WHEN ic.date_shared IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isInitialConsultationShared",
	a.new_agreement_date_sent AS "agreementSentDate",
	(
		CASE
			WHEN a.new_agreement_date_sent IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isAgreementSentDate",
	a.new_agreement_date_signed AS "agreementDateSigned",
	(
		CASE
			WHEN a.new_agreement_date_signed IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isAgreementSigned",
	(
		CASE
			WHEN a.new_agreement_date_shared IS NOT NULL THEN TRUE
			ELSE FALSE
		END
	) AS "isAgreementShared",
  invoice_data.result AS "invoiceData",
	GREATEST(ic.document_date_sent, ic.date_signed, a.new_agreement_date_sent, a.new_agreement_date_signed) as latest
FROM
	companies c
	LEFT JOIN initial_consultations AS ic ON ic.company_id = c.id
	LEFT JOIN agreements AS a ON a.company_id = c.id
`;

function invoicingProcessAggregation(currentYear: number) {
  return sql`LEFT JOIN LATERAL (
		SELECT
			jsonb_object_agg(i."year"::int, CASE
					WHEN i.invoice_info_sent IS NOT NULL THEN i.invoice_info_sent::TIMESTAMP
					WHEN i.invoice_date IS NOT NULL THEN i.invoice_date::TIMESTAMP
					ELSE NULL
				END) AS result
		FROM
			invoicing i
		WHERE
			i.company_id = c.id
			AND i."year" < ${currentYear}
	) invoice_data ON TRUE`;
}

export interface MunicipalityData {
  id: string;
  name: string;
  code: string;
  statusId: number;
  statusName: string;
  email: string;
  responsibles: Responsible[];
  consultations: number[];
  responsibleName?: string;
  responsibleId?: number;
  manualConsultation?: true;
  declinedAgreement?: true;
  workingCategory?: string;
  wave?: string;
  infoVerified?: Date;
  computedStatus: string;
}

type Responsible = { name: string; email: string; phoneNumber: string; title: string; id: string };

export async function getMunicipalitiesData(): Promise<[null, MunicipalityData[]] | [string, null]> {
  try {
    logger.info('Getting municipalities data');
    const data = await db
      .select({
        id: companies.id,
        name: companies.name,
        code: companies.code,
        statusId: companies.statusId,
        statusName: status.name,
        email: companies.email,
        consultations: companies.consultations,
        responsibleName: users.username,
        responsibleId: users.id,
        responsibles: sql<
          Responsible[]
        >`JSON_AGG(JSON_BUILD_OBJECT('name', responsibles.name, 'email', responsibles.email, 'phone', responsibles.phone_number, 'title', responsibles.title, 'id', responsibles.id))`,
        manualConsultation: companies.manualConsultation,
        declinedAgreement: companies.declinedAgreement,
        workingCategory: sql<string>`INITCAP(${companies.workingCategory}::text)`,
        wave: companies.wave,
        infoVerified: companies.infoVerified,
        computedStatus: sql<string>`CASE WHEN ${agreement.newAgreementDateSigned} IS NOT NULL OR ${agreement.oldAgreementDateSigned} IS NOT NULL THEN '3. Agreement signed' WHEN ${initialConsultation.dateSigned} IS NOT NULL AND (${agreement.newAgreementDateSigned} IS NULL AND ${agreement.oldAgreementDateSigned} IS NULL) THEN '2. Only consultation' ELSE '1. No consultation/agreement' END`,
      })
      .from(companies)
      .leftJoin(status, eq(companies.statusId, status.id))
      .leftJoin(responsibles, eq(companies.id, responsibles.companyId))
      .leftJoin(users, eq(companies.responsibleId, users.id))
      .leftJoin(initialConsultation, eq(companies.id, initialConsultation.companyId))
      .leftJoin(agreement, eq(companies.id, agreement.companyId))
      .groupBy(
        companies.id,
        users.username,
        users.id,
        initialConsultation.dateSigned,
        agreement.newAgreementDateSigned,
        agreement.oldAgreementDateSigned,
        status.id,
      )
      .orderBy(asc(companies.name));
    logger.info('Municipalities data fetched');
    return [
      null,
      data.map((item) => ({
        id: item.id,
        name: item.name,
        code: item.code,
        statusId: item.statusId,
        statusName: item.statusName,
        email: item.email,
        responsibles: item.responsibles,
        consultations: item.consultations || [],
        responsibleId: item.responsibleId,
        responsibleName: item.responsibleName,
        manualConsultation: item.manualConsultation,
        declinedAgreement: item.declinedAgreement,
        workingCategory: item.workingCategory,
        wave: item.wave,
        infoVerified: item.infoVerified,
        computedStatus: item.computedStatus, // Use the computed status
      })) as MunicipalityData[],
    ];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipalities data', null];
  }
}

export async function getMunicipalityData(companyId: string): Promise<[null, MunicipalityData] | [string, null]> {
  try {
    logger.info('Getting municipality data');
    const data = await db
      .select({
        id: companies.id,
        name: companies.name,
        code: companies.code,
        email: companies.email,
        consultations: companies.consultations,
        responsibleName: users.username,
        responsibleId: users.id,
        computedStatus: sql<string>`CASE WHEN ${agreement.newAgreementDateSigned} IS NOT NULL OR ${agreement.oldAgreementDateSigned} IS NOT NULL THEN 'Agreement signed' WHEN ${initialConsultation.dateSigned} IS NOT NULL AND (${agreement.newAgreementDateSigned} IS NULL AND ${agreement.oldAgreementDateSigned} IS NULL) THEN 'Only consultation' ELSE 'No consultation/agreement' END`,
        wave: companies.wave,
        infoVerified: companies.infoVerified,
        workingCategory: sql<string>`initcap(${companies.workingCategory}::text)`,
        declinedAgreement: companies.declinedAgreement,
        manualConsultation: companies.manualConsultation,
      })
      .from(companies)
      .leftJoin(users, eq(companies.responsibleId, users.id))
      .leftJoin(initialConsultation, eq(companies.id, initialConsultation.companyId))
      .leftJoin(agreement, eq(companies.id, agreement.companyId))
      .where(eq(companies.id, companyId))
      .groupBy(
        companies.id,
        users.username,
        users.id,
        initialConsultation.dateSigned,
        agreement.newAgreementDateSigned,
        agreement.oldAgreementDateSigned,
      );
    return [null, { ...data[0], consultations: data[0].consultations || [] } as MunicipalityData];
  } catch (e) {
    logger.error(e);
    return ['could not fetch municipality data', null];
  }
}

export async function updateMunicipality(
  args: Omit<InferInsertModel<typeof companies>, 'id'> & { companyId: string },
): Promise<[null, string] | [string, null]> {
  try {
    logger.info('Updating municipalities data');
    await db
      .update(companies)
      .set(omit(args, ['companyId']))
      .where(eq(companies.id, args.companyId));
    logger.info('Municipalities data updated');
    return [null, 'Municipalities data updated'];
  } catch (e) {
    logger.error(e);
    return ['could not update municipalities data', null];
  }
}

export interface ProcessData {
  id: string;
  name: string;
  wave: string;
  workingCategory: string;
  initialConsultationSentDate: Date | null;
  initialConsultationSignedDate: Date | null;
  agreementSentDate: Date | null;
  agreementDateSigned: Date | null;
  isInitialConsultationDateSent: boolean;
  isInitialConsultationSigned: boolean;
  isInitialConsultationShared: boolean;
  isAgreementSentDate: boolean;
  isAgreementSigned: boolean;
  isAgreementShared: boolean;
  invoiceData: {
    year: string;
    date: string | null;
    [key: string]: string | null;
  };
  latestChange: Date | null;
}

export async function getProcessDataForMunicipalities(): Promise<[null, ProcessData[]] | [string, null]> {
  try {
    logger.info('Getting process data for municipalities');
    const query = sql.empty();
    query.append(processQuery);
    query.append(invoicingProcessAggregation(new Date().getFullYear()));
    query.append(sql` ORDER BY latest DESC NULLS LAST`);

    const data = await db.execute(query);
    return [null, data.rows as unknown as ProcessData[]];
  } catch (e) {
    logger.error(e);
    return ['could not fetch process data for municipalities', null];
  }
}
