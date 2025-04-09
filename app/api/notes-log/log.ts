import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { deleteLog, updateLog } from '~/utils/server/repositories/notes-log.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'DELETE') {
    const id = params.logId;
    const error = await deleteLog(id as string);

    if (error) {
      return json({ message: 'Could not delete the log', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Log deleted successfully', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'PATCH') {
    const id = params.logId;
    const formData = await request.formData();
    const description = formData.get('description') as string;
    const date = formData.get('date') as string;
    const reminderDate = formData.get('reminderDueDate');
    const reminderDescription = formData.get('reminderDescription');
    const reminderId = formData.get('reminderId') as string;
    const reminderStatus = formData.get('reminderStatus') as string;
    if (!date || !description) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }
    const error = await updateLog(
      id as string,
      description,
      new Date(date),
      reminderId
        ? {
            reminderId,
            reminderDueDate: new Date(reminderDate as string),
            reminderDescription: reminderDescription ? (reminderDescription as string) : undefined,
            reminderStatus: reminderStatus === 'true',
            companyId: params.companyId as string,
          }
        : reminderDate
          ? {
              reminderDueDate: new Date(reminderDate as string),
              reminderDescription: reminderDescription ? (reminderDescription as string) : undefined,
              companyId: params.companyId as string,
            }
          : undefined,
    );
    if (error) {
      return json({ message: 'Could not update the log', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Log updated successfully', severity: 'success', timeStamp: Date.now() });
  }
}
