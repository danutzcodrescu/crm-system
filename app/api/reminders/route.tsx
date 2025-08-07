import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { isLoggedIn } from '~/utils/server/auth.server';
import { getAllReminders, ReminderData } from '~/utils/server/repositories/reminders.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  const [error, data] = await getAllReminders();
  if (error) {
    return json({ message: 'Could not fetch reminders', severity: 'error' }, { status: 500 });
  }
  return json({ message: { reminders: data as ReminderData[] }, severity: 'success' }, { status: 200 });
}

export default function RemindersApiRoute() {
  return <Outlet />;
}
