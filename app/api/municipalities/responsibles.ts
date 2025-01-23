import { ActionFunctionArgs, json, redirect } from '@remix-run/node';

import { auth } from '~/utils/server/auth.server';
import { createNewResponsible } from '~/utils/server/repositories/responsibles.server';

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const id = params.companyId;

  if (request.method === 'POST') {
    const data = await request.formData();
    if (!id) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: Date.now() },
        { status: 400 },
      );
    }
    const [error] = await createNewResponsible({
      companyId: id as string,
      email: data.get('email') as string,
      phoneNumber: data.get('phoneNumber') as string,
      title: data.get('title') as string,
      name: data.get('name') as string,
    });
    if (error) {
      return json({ message: 'Could not update commune', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Municipality updated successfully', severity: 'success', timeStamp: Date.now() });
  }

  return json({ status: 405 });
}
