import PostAdd from '@mui/icons-material/PostAdd';
import { IconButton, Link, Tooltip } from '@mui/material';
import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { Link as RLink, useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
import { getCompanies } from '~/utils/server/repositories/companies.server';
import { getRecentLogs, LogsWithCompanyDetails } from '~/utils/server/repositories/notes-log.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const [logs, companies] = await Promise.all([getRecentLogs(), getCompanies()]);

  if (logs[0] || companies[0]) {
    return json({ message: 'Could not fetch logs', severity: 'error' }, { status: 500 });
  }

  return json({ message: { logs: logs[1], companies: companies[1] }, severity: 'success' });
}

interface LoaderResponse {
  message: {
    logs: LogsWithCompanyDetails[];
    companies: {
      id: string;
      name: string;
      code: string;
    }[];
  };
}

export default function Logs() {
  const data = useLoaderData<typeof loader>();
  console.log(data);
  const fetcher = useFetcher();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const columns = useMemo<ColumnDef<LogsWithCompanyDetails>[]>(
    () => [
      {
        header: 'Municipality',
        enableHiding: false,
        accessorFn: (row) => row.companyName,
        id: 'companyName',
        size: 200,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.companyId}`} prefetch="intent">
            {getValue() as string}
          </Link>
        ),
         
      },
      {
        header: 'Date',
        accessorKey: 'date',
        id: 'date',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterByDate: true,
          filterOptionsLabel: 'Filter Log Date',
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },

      {
        header: 'Description',
        id: 'description',
        accessorKey: 'description',
        size: 500,
        enableColumnFilter: false,
        enableSorting: false,
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        cell: ({ row }) => {
          return (
            <TableActionsCell
              name={`log`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(data as unknown as LoaderResponse).message.logs],
  );

  const setNewLogFields = useCallback(() => {
    setEditableData([
      {
        label: 'Municipality',
        name: 'companyId',
        type: 'text',
        select: true,
        options: (data as unknown as LoaderResponse).message.companies.map((company) => ({
          label: `${company.name} (${company.code})`,
          value: company.id,
        })),
        required: true,
      },
      {
        label: 'Date',
        name: 'date',
        type: 'date',
        required: true,
        defaultValue: new Date() as unknown as string,
      },
      {
        label: 'Description',
        name: 'description',
        type: 'text',
        required: true,
        multiline: true,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setEditableFields = useCallback((data: LogsWithCompanyDetails) => {
    setEditableData([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Municipality',
        name: 'companyId',
        type: 'text',
        defaultValue: data.companyId,
        hidden: true,
      },
      {
        label: 'Date',
        name: 'date',
        type: 'date',
        required: true,
        defaultValue: data.date as unknown as string,
      },
      {
        label: 'Description',
        name: 'description',
        type: 'text',
        required: true,
        multiline: true,
        defaultValue: data.description,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <PageContainer
        title="Latest logs"
        actionData={fetcher.data as { message: string; severity: string } | undefined}
        additionalTitleElement={
          <Tooltip title="Add new log">
            <IconButton size="small" aria-label="Add new log" onClick={() => setNewLogFields()}>
              <PostAdd />
            </IconButton>
          </Tooltip>
        }
      >
        <PaginatedTable
          data={(data as unknown as LoaderResponse).message.logs}
          columns={columns}
          defaultSorting={{ id: 'date', desc: true }}
        />
      </PageContainer>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Add log`}
            fetcher={fetcher}
            method={fields?.[0]?.name === 'companyId' ? 'POST' : 'PATCH'}
            url={
              fields?.[0]?.name === 'companyId'
                ? `/api/logs`
                : `/api/logs/${fields[1]?.defaultValue as string}/${fields[0]?.defaultValue as string}`
            }
          />
        )}
      </ClientOnly>
    </>
  );
}
