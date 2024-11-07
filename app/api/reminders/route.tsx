import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { deleteReminder, updateReminder } from '~/utils/server/repositories/reminders.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const id = params.reminderId as string;

  if (request.method === 'DELETE') {
    const error = await deleteReminder(id as string);

    if (error) {
      return json({ message: 'Could not delete reminder', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Reminder deleted successfully', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const employeeId = formData.get('employeeId') as string;
    const companyId = formData.get('companyId') as string;
    const completed = formData.get('completed') as string;
    if (!date || !description || !companyId || !completed) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }
    const error = await updateReminder(id as string, {
      companyId,
      employeeId,
      date: new Date(date),
      description,
      completed: completed === 'true',
    });
    if (error) {
      return json({ message: 'Could not update reminder', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Reminder updated successfully', severity: 'success', timeStamp: Date.now() });
  }
}
