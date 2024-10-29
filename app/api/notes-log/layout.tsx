import { ActionFunctionArgs, json } from '@remix-run/node';
import { Outlet, redirect } from '@remix-run/react';

import { auth } from '~/utils/server/auth.server';
import { createLog } from '~/utils/server/repositories/notes-log.server';

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'POST') {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const employeeId = formData.get('employeeId') as string;

    if (!description || !date) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await createLog(employeeId, description, new Date(date));
    if (error) {
      return json({ message: 'Could not create the log', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Log created successfully', severity: 'success', timeStamp: Date.now() });
  }
}

export default function LogsApiLayout() {
  return <Outlet />;
}
