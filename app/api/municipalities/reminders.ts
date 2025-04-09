import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { createReminder } from '~/utils/server/repositories/reminders.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'POST') {
    const data = await request.formData();
    const id = params.companyId;
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }
    const error = await createReminder(
      {
        companyId: id as string,
        description: data.get('description') as string,
        dueDate: new Date(data.get('date') as string),
      },
      data.get('logId') as string,
    );
    if (error) {
      return json({ message: 'Could not create reminder', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Reminder created successfully', severity: 'success', timeStamp: Date.now() });
  }

  return json({ status: 405 });
}
