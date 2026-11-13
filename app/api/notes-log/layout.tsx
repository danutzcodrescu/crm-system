import { ActionFunctionArgs, data as routeData, Outlet, redirect } from 'react-router';

import { isLoggedIn } from '~/utils/server/auth.server';
import { createLog } from '~/utils/server/repositories/notes-log.server';

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  if (request.method === 'POST') {
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const companyId = formData.get('companyId') as string;
    const reminderDate = formData.get('reminderDueDate');
    const reminderDescription = formData.get('reminderDescription');
    if (!description || !date || !companyId) {
      return routeData({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await createLog(
      companyId,
      description,
      new Date(date),
      reminderDate ? new Date(reminderDate as string) : undefined,
      reminderDescription ? (reminderDescription as string) : undefined,
    );
    if (error) {
      return routeData(
        { message: 'Could not create the log', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }
    return routeData({ message: 'Log created successfully', severity: 'success', timeStamp: Date.now() });
  }
}

export default function LogsApiLayout() {
  return <Outlet />;
}
