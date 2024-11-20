import { InferInsertModel, InferSelectModel, relations } from 'drizzle-orm';
import { boolean, pgEnum, pgTable, real, smallint, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const reminderType = pgEnum('reminder_type', ['reminder', 'meeting']);

export const status = pgTable('statuses', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const years = pgTable('years', {
  inflationRate: real('inflation_rate').notNull(),
  name: smallint('name').notNull().unique().primaryKey(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const companies = pgTable('companies', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull().unique(),
  code: text().notNull().unique(),
  statusId: uuid('status_id').references(() => status.id, { onDelete: 'set null', onUpdate: 'no action' }),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const companiesRelations = relations(companies, ({ one, many }) => ({
  status: one(status),
  employees: many(employees),
  reminders: many(reminders),
}));

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  phoneNumber: text('phone_number'),
  email: text('email'),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export const employeesRelations = relations(employees, ({ many }) => ({
  notes: many(notesLog),
  reminders: many(reminders),
}));

export const notesLog = pgTable('notes_log', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp('date').notNull(),
  description: text('description').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
  employeeId: uuid('employee_id')
    .references(() => employees.id, { onDelete: 'cascade' })
    .notNull(),
});

export const reminders = pgTable('reminders', {
  id: uuid('id').primaryKey().defaultRandom(),
  date: timestamp().notNull(),
  description: text(),
  type: reminderType('type').notNull().default('reminder'),
  employeeId: uuid('employee_id').references(() => employees.id),
  companyId: uuid('company_id')
    .references(() => companies.id, { onDelete: 'cascade' })
    .notNull(),
  completed: boolean().default(false).notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { mode: 'date', precision: 3 }).$onUpdate(() => new Date()),
});

export type SelectStatus = InferSelectModel<typeof status>;
export type InsertStatus = InferInsertModel<typeof status>;
