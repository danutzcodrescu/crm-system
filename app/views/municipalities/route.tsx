import PersonAdd from '@mui/icons-material/PersonAdd';
import { Box, IconButton, Link, Stack, Typography } from '@mui/material';
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
import { auth } from '~/utils/server/auth.server';
import { getMunicipalitiesData, MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { getAllStatuses, Status } from '~/utils/server/repositories/status.server';

interface LoaderResponse {
  statuses: Status[];
  municipalities: MunicipalityData[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const [statusData, municipalities] = await Promise.all([getAllStatuses(), getMunicipalitiesData()]);
  if (municipalities[0] || statusData[0]) {
    return json({ message: 'Could not fetch municipalities data', severity: 'error' }, { status: 500 });
  }
  return json({ municipalities: municipalities[1], statuses: statusData[1] });
}

export default function Companies() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const columns = useMemo<ColumnDef<MunicipalityData>[]>(
    () => [
      {
        header: 'Municipality',
        id: 'companyName',
        accessorKey: 'name',
        filterFn: 'includesString',
        size: 250,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.id}`}>
            {getValue() as string}
          </Link>
        ),
      },
      {
        header: 'Code',
        accessorKey: 'code',
      },
      {
        header: 'Status',
        accessorKey: 'statusId',
        id: 'statusId',
        cell: ({ row, getValue }) => `(${getValue() as string}) ${row.original.statusName}`,
        meta: {
          filterOptions: (data as unknown as LoaderResponse).statuses.map((status) => {
            return { label: status.name, value: status.id };
          }),
        },
        filterFn: 'boolean',
      },
      {
        header: 'General Email',
        accessorKey: 'email',
        id: 'email',
        cell: ({ getValue }) => <Link href={`mailto:${getValue() as string}`}>{getValue() as string}</Link>,
      },
      {
        header: 'Responsibles',
        accessorKey: 'responsibles',
        id: 'responsibles',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (
          <Stack direction="column" gap={1}>
            {((getValue() as MunicipalityData['responsibles']) || []).map((item) => (
              <Typography key={item.id} variant="body2">
                {item.name} {item.title ? `- ${item.title}` : ''}
                {item.email ? (
                  <>
                    &nbsp;Email: <Link href={`mailto:${item.email}`}>{item.email}</Link>
                  </>
                ) : (
                  ''
                )}
                {item.phoneNumber ? (
                  <>
                    &nbsp;Phone: <Link href={`tel:${item.phoneNumber}`}>{item.phoneNumber}</Link>
                  </>
                ) : (
                  ''
                )}
              </Typography>
            ))}
          </Stack>
        ),
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
              additionalElement={
                <IconButton aria-label="Add new responsible" onClick={() => setNewResponsibleFields(row.original.id)}>
                  <PersonAdd />
                </IconButton>
              }
              name={`${row.original.name} municipality`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setMunicipalityFields(row.original, (data as unknown as LoaderResponse).statuses)}
              link={`/municipalities/${row.original.id}`}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const setMunicipalityFields = useCallback(
    (data: MunicipalityData, statuses: Status[]) => {
      setEditableData([
        {
          label: 'id',
          name: 'companyId',
          type: 'text',
          defaultValue: data.id,
          hidden: true,
        },
        {
          label: 'Municipality',
          name: 'name',
          type: 'text',
          defaultValue: data.name,
        },
        {
          label: 'Code',
          name: 'code',
          type: 'text',
          defaultValue: data.code,
          inputProps: {
            pattern: '^[0-9]{4}$',
          },
        },
        {
          label: 'General email',
          name: 'email',
          type: 'email',
          defaultValue: data.email,
        },
        {
          label: 'Status',
          name: 'statusId',
          select: true,
          type: 'text',
          options: statuses.map((status) => ({
            label: status.name,
            value: status.id,
          })),
          defaultValue: data.statusId,
        },
      ]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const setNewResponsibleFields = useCallback((id: string) => {
    setEditableData([
      {
        label: 'companyId',
        name: 'companyId',
        type: 'text',
        defaultValue: id,
        hidden: true,
      },
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        defaultValue: '',
      },
      {
        label: 'Title',
        name: 'title',
        type: 'text',
        defaultValue: '',
      },
      {
        label: 'Email',
        name: 'email',
        type: 'email',
        defaultValue: '',
      },
      {
        label: 'Phone',
        name: 'phoneNumber',
        type: 'tel',
        defaultValue: '',
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="Municipalities"
      additionalTitleElement={null}
      actionData={fetcher.data as { message: string; severity: 'string' }}
    >
      <Box sx={{ mt: 2 }}>
        <PaginatedTable data={(data as unknown as LoaderResponse).municipalities} columns={columns} />
      </Box>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`${fields?.[0]?.label === 'companyId' ? 'Add responsible for' : 'Edit data for'} ${(data as LoaderResponse).municipalities?.find((d) => d.id === fields[0]?.defaultValue)?.name}`}
            fetcher={fetcher}
            method={fields?.[0]?.label === fields?.[0]?.name ? 'POST' : 'PATCH'}
            url={
              fields?.[0]?.label === fields?.[0]?.name
                ? `/api/municipalities/${fields?.[0]?.defaultValue}/responsibles`
                : `/api/municipalities/${fields?.[0]?.defaultValue}`
            }
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
