import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { isLoggedIn } from '~/utils/server/auth.server';
import { createNewResponsible, getEmailAddressesByCompanyId } from '~/utils/server/repositories/responsibles.server';

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  if (request.method === 'POST') {
    const formData = await request.formData();
    if (formData.get('companyId')) {
      const [error] = await createNewResponsible({
        companyId: formData.get('companyId') as string,
        email: formData.get('email') as string,
        phoneNumber: formData.get('phoneNumber') as string,
        title: formData.get('title') as string,
        name: formData.get('name') as string,
      });
      if (error) {
        return json(
          { message: 'Could not create responsible', severity: 'error', timeStamp: Date.now() },
          { status: 500 },
        );
      }

      return json({ message: 'Responsible created successfully', severity: 'success', timeStamp: Date.now() });
    }
    const ids = formData.get('ids') as string;
    const [error, data] = await getEmailAddressesByCompanyId(JSON.parse(ids).split(','));
    if (error) {
      return json(
        { message: 'Could not retrieve responsible data', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }
    return json({ message: data?.join(','), severity: 'success', timeStamp: Date.now() });
  }
  return json({ status: 405 });
}

export default function Responsibles() {
  return <Outlet />;
}
