import { ActionFunctionArgs, json } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { createReminder } from '~/utils/server/repositories/reminders.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const employeeId = formData.get('employeeId') as string;
    const companyId = formData.get('companyId') as string;
    const type = formData.get('type') as string;
    if (!date || !description || !companyId || !type) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }
    const error = await createReminder({
      companyId,
      employeeId,
      date: new Date(date),
      description,
      type: type as 'reminder' | 'meeting',
    });
    if (error) {
      return json({ message: 'Could not create reminder', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Reminder created successfully', severity: 'success', timeStamp: Date.now() });
  }
}

export default function RemindersApiLayout() {
  return <Outlet />;
}
