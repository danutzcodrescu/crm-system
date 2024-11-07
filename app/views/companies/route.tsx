import { Box, Link } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link as RLink, useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { AddCompany } from '~/components/companies/AddCompany';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/PaginatedTable';
import { TableActionsCell } from '~/components/shared/TableActionsCell';
import { auth } from '~/utils/server/auth.server';
import { CompanyTable, createCompany, getCompaniesTable } from '~/utils/server/repositories/companies.server';
import { getAllStatuses } from '~/utils/server/repositories/status.server';

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  if (request.method === 'POST') {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const status = formData.get('status') as string;

    if (!name || !status) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await createCompany({ name, statusId: status });
    if (error) {
      return json({ message: 'Could not create commune', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Commune created successfully', severity: 'success', timeStamp: Date.now() });
  }
}

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  // TODO error checking for statusData
  const [statusData, [errorCompanies, companies]] = await Promise.all([getAllStatuses(), getCompaniesTable()]);
  if (errorCompanies) {
    return json({ message: 'Could not fetch companies', severity: 'error' }, { status: 500 });
  }
  return json({ companies, statuses: statusData });
}

export default function Companies() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const columns = useMemo<ColumnDef<CompanyTable>[]>(
    () => [
      {
        header: 'Commune name',
        accessorKey: 'name',
        filterFn: 'includesString',
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/communes/${row.original.id}`}>
            {getValue() as string}
          </Link>
        ),
      },
      {
        header: 'Status',
        accessorKey: 'statusName',
        meta: {
          filterOptions: (data as { statuses: { name: string; id: string }[] }).statuses.map((status) => status.name),
        },
        filterFn: 'arrIncludesSome',
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
            link={`/communes/${row.original.id}`}
            onDelete={(id) => {
              fetcher.submit({}, { method: 'DELETE', action: `/api/companies/${id}`, relative: 'path' });
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
      title="Communes"
      additionalTitleElement={
        <AddCompany
          statuses={(data as unknown as { statuses: { id: string; name: string }[] }).statuses}
          fetcher={fetcher}
        />
      }
      actionData={fetcher.data as { message: string; severity: 'string' }}
    >
      <Box sx={{ mt: 2 }}>
        <PaginatedTable data={(data as unknown as { companies: CompanyTable[] }).companies} columns={columns} />
      </Box>
    </PageContainer>
  );
}
