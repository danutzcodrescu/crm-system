import { desc, eq } from 'drizzle-orm';
import { DatabaseError } from 'pg';

import { companies, employees, notesLog } from '../schema.server';
import { db } from './db.server';

export interface Employee {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  companyName: string | null;
  companyId: string | null;
}

export interface EmployeeWithLogs extends Employee {
  logId: string | null;
  logDate: Date | null;
  logDescription: string | null;
}

export async function getAllEmployees(): Promise<[string | null, Employee[] | null]> {
  try {
    return [
      null,
      await db
        .select({
          id: employees.id,
          name: employees.name,
          email: employees.email,
          phone: employees.phoneNumber,
          companyName: companies.name,
          companyId: companies.id,
        })
        .from(employees)
        .leftJoin(companies, eq(employees.companyId, companies.id))
        .orderBy(employees.name),
    ];
  } catch (e) {
    return [(e as DatabaseError).detail as string, null];
  }
}

export async function deleteEmployee(id: string): Promise<string | null> {
  try {
    await db.delete(employees).where(eq(employees.id, id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function createEmployee(
  name: string,
  companyId: string,
  email?: string,
  phone?: string,
): Promise<string | null> {
  try {
    await db.insert(employees).values({ name, companyId, email, phoneNumber: phone });
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function updateEmployee(employee: Omit<Employee, 'companyName' | 'name'>): Promise<string | null> {
  try {
    await db
      .update(employees)
      .set({ phoneNumber: employee.phone, email: employee.email, companyId: employee.companyId || undefined })
      .where(eq(employees.id, employee.id));
    return null;
  } catch (e) {
    return (e as DatabaseError).detail as string;
  }
}

export async function getEmployee(id: string): Promise<[string | null, Employee | null]> {
  try {
    const results = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        phone: employees.phoneNumber,
        companyName: companies.name,
        companyId: companies.id,
      })
      .from(employees)
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .where(eq(employees.id, id));
    return [null, results[0]];
  } catch (e) {
    return [(e as DatabaseError).detail as string, null];
  }
}

export async function getEmployeeWithLogs(id: string): Promise<[string | null, EmployeeWithLogs[] | null]> {
  try {
    const results = await db
      .select({
        id: employees.id,
        name: employees.name,
        email: employees.email,
        phone: employees.phoneNumber,
        companyName: companies.name,
        companyId: companies.id,
        logId: notesLog.id,
        logDate: notesLog.date,
        logDescription: notesLog.description,
      })
      .from(employees)
      .leftJoin(companies, eq(employees.companyId, companies.id))
      .leftJoin(notesLog, eq(employees.id, notesLog.employeeId))
      .where(eq(employees.id, id))
      .orderBy(desc(notesLog.date));
    return [null, results];
  } catch (e) {
    return [(e as DatabaseError).detail as string, null];
  }
}
