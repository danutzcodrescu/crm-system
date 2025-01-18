import { InferSelectModel, sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgSchema,
  pgTable,
  primaryKey,
  real,
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
  changeFactor: real().default(1.0),
  changeFactorLitter: real().default(1.0),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const companies = pgTable('companies', {
  id: uuid().primaryKey().defaultRandom(),
  name: text().notNull().unique(),
  code: text().notNull().unique(),
  statusId: serial().references(() => status.id, { onDelete: 'set null', onUpdate: 'no action' }),
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
  date: timestamp({ mode: 'date' }).notNull(),
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
  dateSigned: timestamp({ mode: 'date' }),
  dateShared: timestamp({ mode: 'date' }),
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
  oldAgreementDateSigned: timestamp({ mode: 'date' }),
  oldAgreementDateShared: timestamp({ mode: 'date' }),
  oldAgreementLinkToAgreement: text(),
  oldAgreementLinkToAppendix: text(),
  newAgreementSent: boolean().default(false),
  newAgreementDateSigned: timestamp({ mode: 'date' }),
  newAgreementDateShared: timestamp({ mode: 'date' }),
  newAgreementLinkToAgreement: text(),
  createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
});

export const recurringConsultation = pgTable(
  'recurring_consultations',
  {
    companyId: uuid(),
    year: smallint(),
    sentDate: timestamp({ mode: 'date' }),
    meetingDate: timestamp({ mode: 'date' }),
    consultationFormCompleted: boolean(),
    meetingHeld: boolean(),
    dateSharedWithAuthority: timestamp({ mode: 'date' }),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.companyId, table.year] }),
        pkWithCustomName: primaryKey({ name: 'recurringConsultationPK', columns: [table.companyId, table.year] }),
      },
    ];
  },
);

export const reporting = pgTable(
  'reporting',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
    year: smallint().notNull(),
    reportingDate: timestamp({ mode: 'date' }),
    cigaretteButts: real(),
    motivationForData: boolean(),
    motivation: text(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.companyId, table.year] }),
        pkWithCustomName: primaryKey({ name: 'reportingPK', columns: [table.companyId, table.year] }),
      },
    ];
  },
);

export const generalInformation = pgTable(
  'general_information',
  {
    companyId: uuid()
      .notNull()
      .references(() => companies.id, { onDelete: 'cascade', onUpdate: 'no action' }),
    year: smallint().notNull(),
    inhabitants: integer(),
    landSurface: real(),
    cleaningCost: integer(),
    cleanedKg: integer(),
    epaLitterMeasurement: boolean(),
    createdAt: timestamp({ withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp({ withTimezone: true, mode: 'date' }).$onUpdate(() => new Date()),
  },
  (table) => {
    return [
      {
        pk: primaryKey({ columns: [table.companyId, table.year] }),
        pkWithCustomName: primaryKey({ name: 'generalInformationPK', columns: [table.companyId, table.year] }),
      },
    ];
  },
);

export const authSchema = pgSchema('authentication');

export const users = authSchema.table('users', {
  id: serial().primaryKey(),
  username: text().notNull().unique(),
  password: text().notNull(),
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
