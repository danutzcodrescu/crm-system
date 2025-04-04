import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Outlet } from '@remix-run/react';

import { auth } from '~/utils/server/auth.server';
import { getEmailAddressesByCompanyId } from '~/utils/server/repositories/responsibles.server';

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  if (request.method === 'POST') {
    const formData = await request.formData();
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
