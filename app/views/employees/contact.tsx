import { Edit, Email } from '@mui/icons-material';
import { Box, IconButton, Tooltip } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useNavigation } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useEffect, useMemo, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { action as deleteLogAction } from '~/api/notes-log/route';
import { ContactDetails } from '~/components/contacts/ContactDetailts';
import { PageContainer } from '~/components/shared/PageContainer';
import { MetaType, PaginatedTable } from '~/components/shared/PaginatedTable.client';
import { TableActionsCell } from '~/components/shared/TableActionsCell.client';
import { auth } from '~/utils/server/auth.server';
import {
  deleteEmployee,
  EmployeeWithLogs,
  getEmployeeWithLogs,
  updateEmployee,
} from '~/utils/server/repositories/employees.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System -Contacts' },
    {
      name: 'description',
      content: 'Check various contacts for different organizations. You can also add, edit, and delete contacts.',
    },
  ];
};

export async function action({ request, params }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  const id = params.contactId;

  if (request.method === 'DELETE') {
    const error = await deleteEmployee(id as string);
    if (error) {
      return json(
        { message: 'Cold not delete the employee', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }

    return json({ message: 'Employee deleted successfully.', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const companyId = formData.get('companyId') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;

    if (!companyId || (!email && !phone)) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await updateEmployee({ id: id as string, companyId, email, phone });
    if (error) {
      return json(
        { message: 'Cold not update the employee', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }

    return json({ message: 'Employee updated successfully.', severity: 'success', timeStamp: Date.now() });
  }
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const [error, employee] = await getEmployeeWithLogs(params.contactId as string);
  if (error) {
    return json({ message: 'Could not fetch the employee', severity: 'error' }, { status: 500 });
  }
  return json({ message: employee, severity: 'success' });
}

export default function Contact() {
  const logsFetcher = useFetcher<typeof deleteLogAction>();
  const data = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const [isEditing, setEditingMode] = useState(false);

  const columns = useMemo<ColumnDef<EmployeeWithLogs>[]>(
    () => [
      {
        header: 'Date',
        id: 'date',
        accessorKey: 'logDate',
        enableColumnFilter: false,
        cell: ({ getValue }) => (
          <>
            {Intl.DateTimeFormat(navigator.language, { day: '2-digit', month: 'numeric', year: 'numeric' }).format(
              new Date(getValue() as string),
            )}
          </>
        ),
      },
      {
        header: 'Description',
        id: 'description',
        accessorKey: 'logDescription',
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row, table }) => {
          return (
            <TableActionsCell
              name={`log ${row.original.logDate?.toString() as string}`}
              id={row.original.logId as string}
              isEditable
              tableApi={table}
              row={row}
              isEditing={(table.options.meta as MetaType).editedRow == row.id}
              onDelete={(id) => {
                logsFetcher.submit({}, { method: 'DELETE', action: `/api/notes-log/${id}`, relative: 'path' });
              }}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  useEffect(() => {
    if (
      navigation.state === 'loading' &&
      (navigation.formAction as unknown as string)?.startsWith('/contacts/') &&
      navigation.formMethod === 'PATCH' &&
      isEditing
    ) {
      setEditingMode(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state]);

  return (
    <PageContainer
      title={(data.message as EmployeeWithLogs[])[0].name}
      additionalTitleElement={
        <ClientOnly>
          {() => (
            <Tooltip title={`Edit contact ${(data.message as EmployeeWithLogs[])[0].name}`}>
              <IconButton onClick={() => setEditingMode(true)}>
                <Edit />
              </IconButton>
            </Tooltip>
          )}
        </ClientOnly>
      }
      actionData={logsFetcher.data}
    >
      <ContactDetails
        isEditing={isEditing}
        onCancel={() => setEditingMode(false)}
        companyId={(data.message as EmployeeWithLogs[])[0].companyId as string}
        companyName={(data.message as EmployeeWithLogs[])[0].companyName as string}
        email={(data.message as EmployeeWithLogs[])[0].email || ''}
        phone={(data.message as EmployeeWithLogs[])[0].phone || ''}
      />
      <Box sx={{ mt: 2, width: '100%' }}>
        <ClientOnly>
          {() => (
            <PaginatedTable
              columns={columns}
              data={data.message as EmployeeWithLogs[]}
              action="/api/notes-log"
              actionAccessor="logId"
              updateFetcher={logsFetcher}
              newRowObject={{ date: new Date(), description: '' } as unknown as EmployeeWithLogs}
              createNewRow={(newRow) => (
                <>
                  <Tooltip title="New log">
                    <IconButton aria-label="New log" title="New log" onClick={newRow}>
                      <Email />
                    </IconButton>
                  </Tooltip>
                  <input type="hidden" name="employeeId" value={(data.message as EmployeeWithLogs[])[0].id} />
                </>
              )}
            />
          )}
        </ClientOnly>
      </Box>
    </PageContainer>
  );
}
