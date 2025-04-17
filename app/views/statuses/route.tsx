import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { MetaFunction, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { useEditFields } from '~/hooks/editFields';
import { isLoggedIn } from '~/utils/server/auth.server';
import {
  createStatus,
  deleteStatus,
  getAllStatuses,
  Status,
  updateStatus,
} from '~/utils/server/repositories/status.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  const [error, statuses] = await getAllStatuses();
  if (error) {
    return json({ message: 'Could not fetch statuses', severity: 'error', timeStamp: Date.now() }, { status: 500 });
  }
  return json({ statuses });
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  if (request.method === 'DELETE') {
    const formData = await request.formData();
    const id = formData.get('id') as string;

    if (!id) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await deleteStatus(parseInt(id));
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

    const error = await updateStatus(parseInt(id), name);
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
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const deleteStatusHandler = useCallback((id: number) => {
    fetcher.submit({ id }, { method: 'DELETE', action: '/statuses', relative: 'path' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEditableFields = useCallback((data: Status) => {
    setEditableData([
      {
        label: 'id',
        name: 'id',
        type: 'number',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Status Name',
        name: 'statusName',
        type: 'link',
        defaultValue: data.name,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer title="Statuses" additionalTitleElement={null} actionData={fetcher.data}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 2 }}>
        {((data as unknown as { statuses: Status[] }).statuses || []).map((status) => (
          <Stack
            key={status?.id}
            sx={{
              boxShadow: (theme) => theme.shadows[15],
              border: '1px solid',
              borderColor: (theme) => theme.palette.grey[400],
              borderRadius: 1,
              padding: 1.5,
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            gap={1.5}
          >
            <Typography variant="h6" sx={{ flex: 1 }}>
              {status.name}
            </Typography>
            <IconButton onClick={() => setEditableFields(status)} size="small" aria-label={`Edit ${status.name}`}>
              <Edit />
            </IconButton>
            <IconButton
              onClick={() => deleteStatusHandler(status.id)}
              size="small"
              aria-label={`Delete ${status.name}`}
            >
              <Delete />
            </IconButton>
          </Stack>
        ))}
      </Box>

      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit ${((data as unknown as { statuses: Status[] }).statuses || [])?.find((d) => d.id === fields[0]?.defaultValue)?.name} status`}
            fetcher={fetcher}
            url="/statuses"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
