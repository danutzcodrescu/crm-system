import { InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  numeric,
  PgDoublePrecisionBuilderInitial,
  pgEnum,
  pgMaterializedView,
  pgSchema,
  pgTable,
  primaryKey,
  serial,
  smallint,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

export const agreementTypeEnum = pgEnum('agreement_type', ['old', 'new']);

export const status = pgTable('statuses', {
  id: serial().primaryKey(),
  name: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const years = pgTable('years', {
  name: smallint().notNull().unique().primaryKey(),
  changeFactor: numeric().default(
    // @ts-expect-error - this is a hack to make the type system happy
    1,
  ) as unknown as PgDoublePrecisionBuilderInitial<'changeFactor'>,
  changeFactorLitter: numeric().default(
    // @ts-expect-error - this is a hack to make the type system happy
    1,
  ) as unknown as PgDoublePrecisionBuilderInitial<'changeFactorLitter'>,

  sekAdmin: numeric().default(
    // @ts-expect-error - this is a hack to make the type system happy
    0.735147372938808,
  ) as unknown as PgDoublePrecisionBuilderInitial<'sekAdmin'>,
  adminFee: integer().default(8904),
  addition_1: numeric().default('890') as unknown as PgDoublePrecisionBuilderInitial<'addition_1'>,
  addition_2: numeric().default('445') as unknown as PgDoublePrecisionBuilderInitial<'addition_2'>,
  addition_3: numeric().default('65') as unknown as PgDoublePrecisionBuilderInitial<'addition_3'>,
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const companies = pgTable('companies', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  code: text().notNull().unique(),
  statusId: integer().references(() => status.id, { onDelete: 'set null', onUpdate: 'no action' }),
  responsibleId: integer().references(() => users.id, { onDelete: 'set null', onUpdate: 'no action' }),
  consultations: smallint()
    .array()
    .default(sql`ARRAY[]::smallint[]`),
  email: text().notNull().unique(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const logs = pgTable('logs', {
  id: uuid().primaryKey().defaultRandom(),
  description: text().notNull(),
  companyId: uuid().references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
  date: timestamp({ mode: 'date', withTimezone: true }).notNull(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const responsibles = pgTable('responsibles', {
  id: uuid().primaryKey().defaultRandom(),
  name: text(),
  email: text(),
  phoneNumber: text(),
  title: text(),
  companyId: uuid().references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
});

export const initialConsultation = pgTable('initial_consultations', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid()
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
  documentSent: boolean().default(false),
  dateSigned: timestamp({ mode: 'date', withTimezone: true }),
  dateShared: timestamp({ mode: 'date', withTimezone: true }),
  link: text(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const agreement = pgTable('agreements', {
  id: uuid().primaryKey().defaultRandom(),
  companyId: uuid()
    .notNull()
    .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
  typeOfAgreement: agreementTypeEnum().notNull(),
  oldAgreementSent: boolean().default(false),
  oldAgreementDateSigned: timestamp({ mode: 'date', withTimezone: true }),
  oldAgreementDateShared: timestamp({ mode: 'date', withTimezone: true }),
  oldAgreementLinkToAgreement: text(),
  oldAgreementLinkToAppendix: text(),
  newAgreementSent: boolean().default(false),
  newAgreementDateSigned: timestamp({ mode: 'date', withTimezone: true }),
  newAgreementDateShared: timestamp({ mode: 'date', withTimezone: true }),
  newAgreementLinkToAgreement: text(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const recurringConsultation = pgTable(
  'recurring_consultations',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id),
    year: smallint()
      .notNull()
      .references(() => years.name),
    sentDate: timestamp({ mode: 'date', withTimezone: true }),
    meetingDate: timestamp({ mode: 'date', withTimezone: true }),
    consultationFormCompleted: boolean(),
    meetingHeld: boolean(),
    dateSharedWithAuthority: timestamp({ mode: 'date', withTimezone: true }),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [primaryKey({ columns: [table.companyId, table.year] })];
  },
);

export const reporting = pgTable(
  'reporting',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
    year: smallint()
      .notNull()
      .references(() => years.name),
    reportingDate: timestamp({ mode: 'date', withTimezone: true }),
    cigaretteButts: numeric({
      precision: 10,
      scale: 2,
    }) as unknown as PgDoublePrecisionBuilderInitial<'cigaretteButts'>,
    motivation: text(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [primaryKey({ columns: [table.companyId, table.year] })];
  },
);

export const generalInformation = pgTable(
  'general_information',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
    year: smallint()
      .notNull()
      .references(() => years.name),
    inhabitants: integer(),
    landSurface: numeric({ precision: 10, scale: 2 }) as unknown as PgDoublePrecisionBuilderInitial<'landSurface'>,
    cleaningCost: integer(),
    cleanedKg: integer(),
    epaLitterMeasurement: boolean(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [primaryKey({ columns: [table.companyId, table.year] })];
  },
);

export const invoicing = pgTable(
  'invoicing',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
    year: smallint()
      .notNull()
      .references(() => years.name),
    invoiceDate: timestamp({ mode: 'date', withTimezone: true }),
    datePaid: timestamp({ mode: 'date', withTimezone: true }),
    invoiceAmount: numeric({ precision: 10, scale: 2 }) as unknown as PgDoublePrecisionBuilderInitial<'invoiceAmount'>,
    vat: numeric({ precision: 10, scale: 2 }) as unknown as PgDoublePrecisionBuilderInitial<'vat'>,
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [primaryKey({ columns: [table.companyId, table.year] })];
  },
);

export const authSchema = pgSchema('authentication');

export const users = authSchema.table('users', {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  password: text().notNull(),
  gmailRefreshToken: text(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ mode: 'date', withTimezone: true }).$onUpdate(() => new Date()),
});

export const sessions = authSchema.table('sessions', {
  id: text().primaryKey(),
  userId: integer()
    .notNull()
    .references(() => users.id),
  expiresAt: timestamp({
    withTimezone: true,
    mode: 'date',
  }).notNull(),
});

export type User = InferSelectModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;

export const compensationView = pgMaterializedView('compensation_view', {
  year: integer('year').notNull(),
  id: uuid('id').notNull(),
  companyName: text('company_name'),
  inhabitants: integer('inhabitants'),
  typeOfAgreement: agreementTypeEnum('type_of_agreement'),
  inAgreement: boolean('in_agreement'),
  variableCompensation: numeric(
    'variable_compensation',
  ) as unknown as PgDoublePrecisionBuilderInitial<'variable_compensation'>,
  totalAddition: numeric('total_addition') as unknown as PgDoublePrecisionBuilderInitial<'total_addition'>,
  changeFactor: numeric('change_factor') as unknown as PgDoublePrecisionBuilderInitial<'change_factor'>,
  changeFactorLitter: numeric(
    'change_factor_litter',
  ) as unknown as PgDoublePrecisionBuilderInitial<'change_factor_litter'>,
  totalCompensationNew: numeric(
    'total_compensation_new',
  ) as unknown as PgDoublePrecisionBuilderInitial<'total_compensation_new'>,
  totalCompensationOld: numeric(
    'total_compensation_old',
  ) as unknown as PgDoublePrecisionBuilderInitial<'total_compensation_old'>,
  totalCompensation: integer('total_compensation'),
}).as(sql`
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
	LEFT JOIN "years" ON years."name" = totalval.year`);
