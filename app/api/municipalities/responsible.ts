import { ActionFunctionArgs, data as routeData, redirect } from 'react-router';

import { isLoggedIn } from '~/utils/server/auth.server';
import { deleteResponsible, updateResponsible } from '~/utils/server/repositories/responsibles.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  if (request.method === 'PATCH') {
    const data = await request.formData();
    const id = params.responsibleId;
    if (!id) {
      return routeData(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }

    const [error] = await updateResponsible({
      id,
      name: data.get('name') as string,
      email: data.get('email') as string,
      phoneNumber: data.get('phoneNumber') as string,
      mobileNumber: data.get('mobileNumber') as string,
      title: data.get('title') as string,
    });

    if (error) {
      return routeData({ message: error, severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return routeData({ message: 'Responsible updated successfully', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'DELETE') {
    const id = params.responsibleId;
    if (!id) {
      return routeData(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }

    const [error] = await deleteResponsible(id);
    if (error) {
      return routeData({ message: error, severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return routeData({ message: 'Responsible deleted successfully', severity: 'success', timeStamp: Date.now() });
  }

  return routeData({ status: 405 });
}
