import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { AddContact } from '~/components/contacts/AddContact';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/PaginatedTable';
import { TableActionsCell } from '~/components/shared/TableActionsCell';
import { auth } from '~/utils/server/auth.server';
import { createEmployee, Employee, getAllEmployees } from '~/utils/server/repositories/employees.server';

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

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const [error, data] = await getAllEmployees();

  if (error) {
    return json({ message: 'Could not fetch employees', severity: 'error' }, { status: 500 });
  }

  return json({ employees: data as Employee[] });
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'POST') {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const companyId = formData.get('companyId') as string;
    const email = formData.get('email') as string;
    const phone = formData.get('phone') as string;
    if (!name || !companyId || (!email && !phone)) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }
    const error = await createEmployee(name, companyId, email, phone);
    if (error) {
      return json(
        { message: 'Cold not create employee record', severity: 'error', timeStamp: Date.now() },
        { status: 500 },
      );
    }
    return json({ message: 'Employee created successfully.', severity: 'success', timeStamp: Date.now() });
  }
}

export default function EmployeesPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        filterFn: 'includesString',
      },
      {
        header: 'Company',
        accessorKey: 'companyName',
        filterFn: 'includesString',
      },
      {
        header: 'Email',
        accessorKey: 'email',
        filterFn: 'includesString',
      },
      {
        header: 'Phone',
        accessorKey: 'phone',
        enableSorting: false,
        enableColumnFilter: false,
      },
      {
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => (
          <TableActionsCell
            name={`contact ${row.original.name}`}
            id={row.original.id}
            isEditable={false}
            link={`/contacts/${row.original.id}`}
            onDelete={(id) => {
              fetcher.submit({}, { method: 'DELETE', action: `/contacts/${id}`, relative: 'path' });
            }}
          />
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  return (
    <PageContainer
      title="Employees"
      additionalTitleElement={<AddContact fetcher={fetcher} />}
      actionData={fetcher.data}
    >
      <Box sx={{ mt: 2 }}>
        <PaginatedTable data={(data as unknown as { employees: Employee[] }).employees} columns={columns} />
      </Box>
    </PageContainer>
  );
}
