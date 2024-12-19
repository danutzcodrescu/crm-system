import { ActionFunctionArgs } from '@remix-run/node';
import { json } from '@remix-run/react';

import { auth } from '~/utils/server/auth.server';

export async function action({ request }: ActionFunctionArgs) {
  if (request.method === 'POST') {
    const formData = await request.formData();
    const username = formData.get('username') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    if (password !== confirmPassword) {
      return json({ message: 'Passwords do not match', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    if (!username || !password) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const [error] = await auth.signUp(username, password, request, false);
    if (error) {
      return json({ message: 'Could not create the user', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'User created successfully', severity: 'success', timeStamp: Date.now() });
  }
}
