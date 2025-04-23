import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { Box, IconButton, Link, Stack, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, ShouldRevalidateFunctionArgs, useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef, ColumnFiltersState, Row } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { SendEmail } from '~/components/shared/SendEmail';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { UploadButton } from '~/components/shared/UploadButton.client';
import { useEditFields } from '~/hooks/editFields';
import { filterWaveUnderCategory, useWorkingWaveFiltering } from '~/hooks/waveFiltering';
import { formatDate } from '~/utils/client/dates';
import { isLoggedIn } from '~/utils/server/auth.server';
import { getMunicipalitiesData, MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { getAllStatuses, Status } from '~/utils/server/repositories/status.server';
import { getAllUsers, User } from '~/utils/server/repositories/users.server';
import { useIds } from '~/utils/store';

interface LoaderResponse {
  statuses: Status[];
  municipalities: MunicipalityData[];
  users: User[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  const [statusData, municipalities, users] = await Promise.all([
    getAllStatuses(),
    getMunicipalitiesData(),
    getAllUsers(),
  ]);
  if (municipalities[0] || statusData[0] || users[0]) {
    return json({ message: 'Could not fetch municipalities data', severity: 'error' }, { status: 500 });
  }
  return json({ municipalities: municipalities[1], statuses: statusData[1], users: users[1] });
}

export function shouldRevalidate({ formAction }: ShouldRevalidateFunctionArgs) {
  if (formAction === '/api/responsibles') return false;
  return true;
}

export const meta: MetaFunction<typeof loader> = () => {
  return [{ title: `CRM System - Municipalities`, description: 'Municipalities overview information' }];
};

export default function Companies() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const setIds = useIds((state) => state.setIds);
  const { filterItems, waveFilterList } = useWorkingWaveFiltering();
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
        header: 'Info Verified',
        id: 'infoVerified',
        accessorFn: (row) => (row.infoVerified ? new Date(row.infoVerified) : null),
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: (row: Row<MunicipalityData>, columnId: string, filterValue: boolean[]) => {
          if (filterValue === undefined) return true;
          // @ts-expect-error it works , type is not correct
          const value = row.original[columnId];

          if ((filterValue.includes(true) && value) || (filterValue.includes(false) && !value)) {
            return true;
          }
          return false;
        },
        meta: {
          filterOptions: [
            { label: 'Has date', value: true },
            { label: 'No date', value: false },
          ],
          filterOptionsLabel: 'Filter by info verified',
        },
      },
      {
        header: 'Status',
        accessorKey: 'computedStatus',
        id: 'computedStatus',
        meta: {
          filterOptions: [
            {
              label: '1. No consultation/agreement',
              value: '1. No consultation/agreement',
            },
            {
              label: '2. Only consultation',
              value: '2. Only consultation',
            },
            {
              label: '3. Agreement signed',
              value: '3. Agreement signed',
            },
          ],
        },
        filterFn: 'boolean',
      },
      {
        header: 'Manual Consultation',
        accessorKey: 'manualConsultation',
        id: 'manualConsultation',
        cell: ({ getValue }) =>
          getValue() ? <CheckBox sx={{ color: (theme) => theme.palette.success.main }} /> : null,
      },
      {
        header: 'Declines Agreement',
        id: 'declinedAgreement',
        accessorKey: 'declinedAgreement',
        cell: ({ getValue }) => (getValue() ? <Cancel sx={{ color: (theme) => theme.palette.error.main }} /> : null),
      },
      {
        header: 'Wave',
        id: 'workingCategory',
        accessorKey: 'workingCategory',
        meta: {
          filterOptions: [
            {
              label: 'Wave 1',
              value: 'Wave 1',
            },
            {
              label: 'Wave 2',
              value: 'Wave 2',
            },
            {
              label: 'Wave 3',
              value: 'Wave 3',
            },
          ],
        },
        filterFn: 'boolean',
      },
      {
        header: 'Wave under category',
        accessorKey: 'wave',
        id: 'wave',
        filterFn: filterWaveUnderCategory,
        meta: {
          filterOptions: waveFilterList,
          filterOptionsLabel: 'Filter wave by subcategory',
        },
      },
      {
        header: 'SUP responsible',
        accessorKey: 'responsibleName',
        id: 'responsibleName',
        meta: {
          filterOptions: (data as unknown as LoaderResponse).users.map((user) => {
            return { label: user.name, value: user.id };
          }),
        },
        filterFn: 'boolean',
      },
      {
        header: 'Old Status',
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
              onEdit={() =>
                setMunicipalityFields(
                  row.original,
                  (data as unknown as LoaderResponse).statuses,
                  (data as unknown as LoaderResponse).users,
                )
              }
              link={`/municipalities/${row.original.id}`}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, waveFilterList],
  );

  const setMunicipalityFields = useCallback(
    (data: MunicipalityData, statuses: Status[], users: User[]) => {
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
          label: 'SUP responsible',
          name: 'responsibleId',
          select: true,
          type: 'text',
          // @ts-expect-error it works for now TO DO: fix it
          options: users
            .map((user) => ({
              label: user.name,
              value: user.id,
            }))
            .concat({ label: 'None', value: 0 }),
          defaultValue: data.responsibleId || 0,
        },
        {
          label: 'Manual Consultation',
          name: 'manualConsultation',
          type: 'text',
          select: true,
          defaultValue: data.manualConsultation,
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'Blank', value: '' },
          ],
        },
        {
          label: 'Declines Agreement',
          name: 'declinedAgreement',
          type: 'text',
          select: true,
          defaultValue: data.declinedAgreement,
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'Blank', value: '' },
          ],
        },
        {
          label: 'Wave',
          name: 'workingCategory',
          type: 'text',
          select: true,
          defaultValue: data.workingCategory?.toLowerCase(),
          watchable: true,
          options: [
            { label: 'Wave 1', value: 'wave 1' },
            { label: 'Wave 2', value: 'wave 2' },
            { label: 'Wave 3', value: 'wave 3' },
          ],
        },
        {
          label: 'Wave under group',
          name: 'wave',
          type: 'text',
          select: true,
          defaultValue: data.wave,
          condition: ['workingCategory', 'wave 2'],
          options: [
            { label: 'A', value: 'A' },
            { label: 'B', value: 'B' },
            { label: 'C', value: 'C' },
            { label: 'D', value: 'D' },
            { label: 'E', value: 'E' },
            { label: 'F', value: 'F' },
            { label: 'G', value: 'G' },
            { label: 'H', value: 'H' },
            { label: 'Z', value: 'Z' },
          ],
        },
        {
          label: 'Wave under group',
          name: 'wave',
          type: 'text',
          select: true,
          defaultValue: data.wave,
          condition: ['workingCategory', 'wave 3'],
          options: [
            { label: 'X', value: 'X' },
            { label: 'X1', value: 'X1' },
            { label: 'X2', value: 'X2' },
            { label: 'X3', value: 'X3' },
          ],
        },
        {
          label: 'Wave under group',
          name: 'wave',
          type: 'text',
          defaultValue: '',
          condition: ['workingCategory', 'wave 1'],
          hidden: true,
        },
        {
          label: 'Info Verified',
          name: 'infoVerified',
          type: 'date',
          defaultValue: data.infoVerified as unknown as string,
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

  const setFilter = (rows: Row<MunicipalityData>[], filters: ColumnFiltersState) => {
    setIds(rows.map((row) => row.original.id));
    filterItems(filters);
  };

  return (
    <PageContainer
      title="Municipalities"
      additionalTitleElement={
        <Stack direction="row" alignItems="center" gap={1}>
          <SendEmail />
          <ClientOnly>
            {() => (
              <UploadButton
                search={location.search}
                title="Import responsibles for municipalities"
                fetcher={fetcher}
                path="/api/responsibles/import"
              />
            )}
          </ClientOnly>
        </Stack>
      }
      actionData={fetcher.data as { message: string; severity: 'string' }}
    >
      <Box sx={{ mt: 2, '& .MuiTableContainer-root': { maxHeight: 'calc(100vh - 215px)' } }}>
        <PaginatedTable
          onFilter={setFilter}
          data={(data as unknown as LoaderResponse).municipalities}
          columns={columns}
        />
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
