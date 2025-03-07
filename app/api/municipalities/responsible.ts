import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { deleteResponsible, updateResponsible } from '~/utils/server/repositories/responsibles.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'PATCH') {
    const data = await request.formData();
    const id = params.responsibleId;
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }

    const [error] = await updateResponsible({
      id,
      name: data.get('name') as string,
      email: data.get('email') as string,
      phoneNumber: data.get('phoneNumber') as string,
      title: data.get('title') as string,
    });

    if (error) {
      return json({ message: error, severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Responsible updated successfully', severity: 'success', timeStamp: Date.now() });
  }

  if(request.method === 'DELETE') {
    const id = params.responsibleId;
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }

    const [error] = await deleteResponsible(id);
    if (error) {
      return json({ message: error, severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Responsible deleted successfully', severity: 'success', timeStamp: Date.now() });
  }

  return json({ status: 405 });
}
