import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import { FormControl, InputLabel, Link, MenuItem, Select, Typography } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, useFetcher, useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { getYear } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
import {
  editReportingRecord,
  getAllReportingDataPerYear,
  ReportingData,
} from '~/utils/server/repositories/reporting.server';
import { getAllYears } from '~/utils/server/repositories/years.server';

interface LoaderResponse {
  yearsData: number[];
  reportingData: ReportingData[];
}

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Reporting state' },
    { name: 'description', content: 'Reporting stage with all the municipalities' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'PATCH') {
    const body = await request.formData();
    const id = body.get('companyId');
    const year = body.get('year');

    if (!id || !year) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: new Date() },
        { status: 400 },
      );
    }
    const [error] = await editReportingRecord({
      companyId: id as string,
      year: parseInt(year as string),
      // @ts-expect-error we know that the value is a string
      reportingDate: body.get('reportingDate') as string,
      cigaretteButts: body.get('cigaretteButts') ? parseInt(body.get('cigaretteButts') as string) : null,
      motivation: body.get('motivation') as string,
      // @ts-expect-error we know that the value is a string
      motivationForData: body.get('motivationForData'),
    });

    if (error) {
      return json(
        { message: 'Could not update the record', severity: 'error', timeStamp: new Date() },
        { status: 500 },
      );
    }
    return json({ message: 'Record updated successfully', severity: 'success', timeStamp: new Date() });
  }
  return json({ status: 405 });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const year = new URL(request.url).searchParams.get('year');
  if (!year) {
    return redirect(`/reporting?year=${getYear(new Date())}`);
  }
  const [recurringData, yearsData] = await Promise.all([getAllReportingDataPerYear(parseInt(year)), getAllYears(2023)]);
  if (recurringData[0] || yearsData[0]) {
    return json({ error: recurringData[0] || yearsData[0] }, { status: 500 });
  }
  return json({ reportingData: recurringData[1], yearsData: yearsData[1] });
}

export default function Reporting() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const columns = useMemo<ColumnDef<ReportingData>[]>(
    () => [
      {
        header: 'Municipality',
        enableHiding: false,
        accessorFn: (row) => row.companyName,
        id: 'companyName',
        size: 200,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.id}`} prefetch="intent">
            {getValue() as string}
          </Link>
        ),
        // eslint-disable-next-line react-hooks/exhaustive-deps
      },
      {
        header: 'In agreement',
        accessorKey: 'inAgreement',
        id: 'inAgreement',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Filter In agreement',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Have reported',
        accessorKey: 'haveReported',
        id: 'haveReported',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Filter Have reported',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Reporting date',
        accessorKey: 'reportingDate',
        id: 'reportingDate',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterByDate: true,
          filterOptionsLabel: 'Filter Reporting Date',
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Reported before deadline',
        accessorKey: 'reportedBeforeDeadline',
        id: 'reportedBeforeDeadline',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Filter Have reported before deadline',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Cigarette butts (kg)',
        accessorKey: 'cigaretteButts',
        id: 'cigaretteButs',
        enableColumnFilter: false,
        cell: ({ getValue }) => (getValue() ? Intl.NumberFormat('sv-SE').format(getValue() as number) : ''),
      },
      {
        header: 'Motivation for data',
        accessorKey: 'motivationForData',
        id: 'motivationForData',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Motivation for data',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Motivation',
        accessorKey: 'motivation',
        id: 'motivation',
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
              name={`${row.original.companyName as string} municipality`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
              link={`/municipalities/${row.original.id}`}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(data as LoaderResponse).yearsData],
  );
  const setEditableFields = useCallback((data: ReportingData) => {
    setEditableData([
      {
        label: 'id',
        name: 'companyId',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'year',
        name: 'year',
        type: 'number',
        defaultValue: data.year,
        hidden: true,
      },
      {
        label: 'Reporting date',
        name: 'reportingDate',
        type: 'date',
        defaultValue: data.reportingDate as unknown as string,
      },
      {
        label: 'Cigarette butts (kg)',
        name: 'cigaretteButts',
        type: 'number',
        defaultValue: data.cigaretteButts || undefined,
      },
      {
        label: 'Motivation for data',
        name: 'motivationForData',
        type: 'text',
        select: true,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        defaultValue: !!data.motivationForData,
      },
      {
        label: 'Motivation',
        name: 'motivation',
        type: 'text',
        multiline: true,
        maxRows: 5,
        defaultValue: data.motivation || undefined,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="Reporting"
      additionalTitleElement={
        <FormControl>
          <InputLabel id="years-selector">Select the year</InputLabel>
          <Select
            labelId="years-selector"
            value={new URLSearchParams(location.search).get('year')}
            label="Select the year"
            onChange={(e) => navigate({ search: `?year=${e.target.value}` })}
          >
            {(data as unknown as LoaderResponse).yearsData.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        data={(data as unknown as LoaderResponse).reportingData}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>In agreement: {rows.filter((row) => row.original.inAgreement).length}</Typography>
            <Typography>Have reported: {rows.filter((row) => row.original.haveReported).length}</Typography>
            <Typography>
              Reported before deadline: {rows.filter((row) => row.original.reportedBeforeDeadline).length}
            </Typography>
            <Typography>
              Total cigarette butts collected:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, val) => {
                  if (val.original.cigaretteButts) {
                    return acc + parseFloat(val.original.cigaretteButts as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
            <Typography>Motivation for data: {rows.filter((row) => row.original.motivationForData).length}</Typography>
          </>
        )}
      />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit recurring consultation for ${(data as LoaderResponse).reportingData?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/reporting"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
