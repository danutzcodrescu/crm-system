import { ActionFunctionArgs, data as routeData, redirect } from 'react-router';

import { isLoggedIn } from '~/utils/server/auth.server';
import { createNewResponsible } from '~/utils/server/repositories/responsibles.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const id = params.companyId;

  if (request.method === 'POST') {
    const data = await request.formData();
    if (!id) {
      return routeData(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }
    const [error] = await createNewResponsible({
      companyId: id as string,
      email: data.get('email') as string,
      phoneNumber: data.get('phoneNumber') as string,
      mobileNumber: data.get('mobileNumber') as string,
      title: data.get('title') as string,
      name: data.get('name') as string,
    });
    if (error) {
      return routeData(
        { message: 'Could not update commune', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }

    return routeData({ message: 'Responsible created succesfully', severity: 'success', timeStamp: Date.now() });
  }

  return routeData({ status: 405 });
}
