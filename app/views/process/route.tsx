import CheckBox from '@mui/icons-material/CheckBox';
import List from '@mui/icons-material/List';
import { Link } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, useLoaderData } from '@remix-run/react';
import { CellContext, ColumnDef, ColumnFiltersState, Row } from '@tanstack/react-table';
import { range } from 'lodash-es';
import { useMemo } from 'react';

import { PageContainer } from '~/components/shared/PageContainer';
import { SendEmail } from '~/components/shared/SendEmail';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { filterWaveUnderCategory, useWorkingWaveFiltering } from '~/hooks/waveFiltering';
import { formatDate } from '~/utils/client/dates';
import { isLoggedIn } from '~/utils/server/auth.server';
import { getProcessDataForMunicipalities, ProcessData } from '~/utils/server/repositories/municipalities.server';
import { useIds } from '~/utils/store';

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  const [error, data] = await getProcessDataForMunicipalities();

  if (error) {
    return json({ error: 'Could not fetch municipalities process data' }, { status: 500 });
  }

  return json({ data });
}

export const meta: MetaFunction = () => {
  return [{ title: `CRM System - Process`, description: 'Process overview information' }];
};

export default function ProcessRoute() {
  const data = useLoaderData<typeof loader>();
  const setIds = useIds((state) => state.setIds);
  const { filterItems, waveFilterList } = useWorkingWaveFiltering();
  const columns = useMemo<ColumnDef<ProcessData>[]>(
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
        header: 'Initial consultation document sent',
        accessorKey: 'isInitialConsultationDocumentSent',
        filterFn: 'boolean',
        id: 'isInitialConsultationDocumentSent',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Initial consultation sent',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      {
        header: 'Initial consultation signed',
        accessorKey: 'isInitialConsultationSigned',
        filterFn: 'boolean',
        id: 'isInitialConsultationSigned',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Initial consultation signed',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      {
        header: 'Initial consultation shared with EPA',
        accessorKey: 'isInitialConsultationShared',
        filterFn: 'boolean',
        id: 'isInitialConsultationShared',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Initial consultation shared',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      {
        header: 'Agreement sent',
        accessorKey: 'isAgreementSentDate',
        filterFn: 'boolean',
        id: 'isAgreementSentDate',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Agreement sent',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      {
        header: 'Agreement signed',
        accessorKey: 'isAgreementSigned',
        filterFn: 'boolean',
        id: 'isAgreementSigned',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Agreement signed',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      {
        header: 'Agreement shared with EPA',
        accessorKey: 'isAgreementShared',
        filterFn: 'boolean',
        id: 'isAgreementShared',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Agreement shared',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
      },
      ...(range(2023, new Date().getFullYear()).map((year) => ({
        header: `Invoice information for ${year} sent`,
        id: `invoiceData${year}`,
        accessorFn: (row: ProcessData) => !!row.invoiceData[year],
        filterFn: (row: Row<ProcessData>, _: string, filterValue: boolean[]) =>
          filterValue.includes(!!row.original.invoiceData[year]),
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Agreement shared',
        },
        cell: ({ getValue }: CellContext<ProcessData, boolean>) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <List sx={{ color: (theme) => theme.palette.warning.main }} />
          ),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      })) as any),
      {
        header: 'Time for sending initial consultation',
        id: 'initialConsultationDateSent',
        accessorKey: 'initialConsultationDateSent',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
        size: 270,
        meta: {
          filterOptionsLabel: 'Time for sending initial consultation document',
          filterByDate: true,
        },
      },
      {
        header: 'Time for signing initial consultation',
        id: 'initialConsultationDateSigned',
        accessorKey: 'initialConsultationDateSigned',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
        size: 270,
        meta: {
          filterOptionsLabel: 'Time for signing initial consultation document',
          filterByDate: true,
        },
      },
      {
        header: 'Time for sending new agreement',
        id: 'agreementSentDate',
        accessorKey: 'agreementSentDate',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
        size: 270,
        meta: {
          filterOptionsLabel: 'Time for sending new agreement document',
          filterByDate: true,
        },
      },
      {
        header: 'Time for signing new agreement',
        id: 'agreementDateSigned',
        accessorKey: 'agreementDateSigned',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
        size: 270,
        meta: {
          filterOptionsLabel: 'Time for signing agreement document',
          filterByDate: true,
        },
      },
      {
        header: 'Latest Date',
        id: 'latest',
        accessorKey: 'latest',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
        sortUndefined: 'last',
        meta: {
          filterOptionsLabel: 'Filter latest change date',
          filterByDate: true,
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data, waveFilterList],
  );

  const setFilter = (rows: Row<ProcessData>[], filters: ColumnFiltersState) => {
    setIds(rows.map((row) => row.original.id));
    filterItems(filters);
  };

  return (
    <PageContainer title="Process" additionalTitleElement={<SendEmail />}>
      <PaginatedTable
        onFilter={setFilter}
        data={(data as { data: ProcessData[] }).data}
        columns={columns}
        defaultSorting={{ id: 'latest', desc: true }}
      />
    </PageContainer>
  );
}
