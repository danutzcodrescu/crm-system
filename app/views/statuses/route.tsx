import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { MetaFunction, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback } from 'react';

import { PageContainer } from '~/components/shared/PageContainer';
import { AddStatus } from '~/components/status/AddStatus';
import { StatusItem } from '~/components/status/StatusItem';
import { auth } from '~/utils/server/auth.server';
import { createStatus, deleteStatus, getAllStatuses, updateStatus } from '~/utils/server/repositories/status.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const statuses = await getAllStatuses();
  return json({ statuses });
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  if (request.method === 'DELETE') {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await deleteStatus(id);
    if (error) {
      return json({ message: 'Cold not delete the status', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Status deleted succesfully.', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const id = formData.get('id') as string;
    const name = formData.get('statusName') as string;

    if (!id || !name) {
      return json({ message: 'Missing parameteers', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await updateStatus(id, name);
    if (error) {
      return json(
        { message: 'Could not update the status', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }
    return json({ message: 'Status updated succesfully.', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const name = formData.get('statusName') as string;
    if (!name) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await createStatus(name);
    if (error) {
      return json({ message: 'Could not create status', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Status created succesfully.', severity: 'success', timeStamp: Date.now() });
  }
  return json({ message: '', severity: 'error' }, { status: 405 });
}

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Status' },
    {
      name: 'description',
      content:
        'Check various statuses that can be assigned to the organizations to describe their contractual situation',
    },
  ];
};

export default function StatusPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const deleteStatus = useCallback((id: string) => {
    fetcher.submit({ id }, { method: 'DELETE', action: '/statuses', relative: 'path' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer title="Statuses" additionalTitleElement={<AddStatus fetcher={fetcher} />} actionData={fetcher.data}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 2 }}>
        {data.statuses.map((status) => (
          <StatusItem id={status.id} name={status.name} key={status.id} deleteStatus={deleteStatus} />
        ))}
      </Box>
    </PageContainer>
  );
}
