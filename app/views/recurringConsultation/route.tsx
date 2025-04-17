import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import { FormControl, InputLabel, Link, MenuItem, Select, Stack, Typography } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import {
  Link as RLink,
  ShouldRevalidateFunctionArgs,
  useFetcher,
  useLoaderData,
  useLocation,
  useNavigate,
} from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { getYear } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { SendEmail } from '~/components/shared/SendEmail';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { isLoggedIn } from '~/utils/server/auth.server';
import {
  getFistRecurringConsultationYearFormCompany,
  updateRecurringConsultations,
} from '~/utils/server/repositories/companies.server';
import {
  editRecurringConsultationRecord,
  getRecurringConsultationData,
  RecurringConsultationPerMunicipality,
} from '~/utils/server/repositories/recurringConsultation.server';
import { getAllYears } from '~/utils/server/repositories/years.server';
import { useIds } from '~/utils/store';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Recurring consultation' },
    { name: 'description', content: 'Recurring consultation stage with all the municipalities' },
  ];
};

interface LoaderResponse {
  yearsData: number[];
  recurringData: RecurringConsultationPerMunicipality[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!isLoggedIn(request)) {
    return redirect('/signin');
  }
  const year = new URL(request.url).searchParams.get('year');
  if (!year) {
    return redirect(`/recurring-consultation?year=${getYear(new Date())}`);
  }
  const [recurringData, yearsData] = await Promise.all([
    getRecurringConsultationData(parseInt(year)),
    getAllYears(2024),
  ]);
  if (recurringData[0] || yearsData[0]) {
    return json({ error: recurringData[0] || yearsData[0] }, { status: 500 });
  }
  return json({ recurringData: recurringData[1], yearsData: yearsData[1] });
}

export async function action({ request }: ActionFunctionArgs) {
  if (!isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'PATCH') {
    const body = await request.formData();
    const id = body.get('id');
    const year = body.get('year');

    if (!id || !year) {
      return json(
        { message: 'Missing required parameters', severity: 'error', timeStamp: new Date() },
        { status: 400 },
      );
    }
    const promises = [
      editRecurringConsultationRecord({
        companyId: id as string,
        year: parseInt(year as string),
        // @ts-expect-error - we know that these values are strings
        sentDate: body.get('sentDate') as string,
        // @ts-expect-error - we know that these values are strings
        meetingDate: body.get('meetingDate') as string,
        consultationFormCompleted: body.get('consultationFormCompleted') === 'true',
        meetingHeld:
          body.get('meetingHeld') === 'true' ? true : body.get('meetingHeld') === 'false' ? false : undefined,
        // @ts-expect-error - we know that these values are strings
        dateSharedWithAuthority: body.get('dateSharedWithAuthority') as string,
      }),
    ];
    if (body.get('firstRecurringConsultation')) {
      const newYear = parseInt(body.get('firstRecurringConsultation') as string);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const [_, consultationYear] = await getFistRecurringConsultationYearFormCompany(id as string);
      if (consultationYear !== newYear) {
        promises.push(updateRecurringConsultations(id as string, [newYear, newYear + 2, newYear + 4, newYear + 6]));
      }
    }
    const [consultation, municipality] = await Promise.all(promises);

    if (consultation[0] || municipality?.[0]) {
      return json(
        { message: 'Could not update the record', severity: 'error', timeStamp: new Date() },
        { status: 500 },
      );
    }
    return json({ message: 'Record updated successfully', severity: 'success', timeStamp: new Date() });
  }

  return json({ status: 405 });
}

export function shouldRevalidate({ formAction }: ShouldRevalidateFunctionArgs) {
  if (formAction === '/api/responsibles') return false;
  return true;
}

export default function RecurringConsultation() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const setIds = useIds((state) => state.setIds);
  const setEditableFields = useCallback((data: RecurringConsultationPerMunicipality) => {
    const fields = [
      {
        label: 'id',
        name: 'id',
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
        label: 'Date for sending info + form',
        name: 'sentDate',
        type: 'date',
        defaultValue: data.sentDate as unknown as string,
      },
      {
        label: 'Meeting date',
        name: 'meetingDate',
        type: 'datetime',
        defaultValue: data.meetingDate as unknown as string,
      },
      {
        label: 'Consultation form completed',
        name: 'meetingDate',
        select: true,
        type: 'text',
        options: [
          {
            label: 'Yes',
            value: 'true',
          },
          {
            label: 'No',
            value: 'false',
          },
          { label: 'N/A', value: undefined },
        ],
        defaultValue: data.consultationFormCompleted as boolean,
      },
      {
        label: 'Meeting held',
        name: 'meetingHeld',
        type: 'text',
        select: true,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
          { label: 'N/A', value: '' },
        ],
        defaultValue: data.meetingHeld as boolean,
      },
      {
        label: 'Date shared with NPA',
        name: 'dateSharedWithAuthority',
        type: 'date',
        defaultValue: data.dateSharedWithAuthority as unknown as string,
      },
    ];
    if (data.recurringConsultation) {
      fields.splice(2, 0, {
        label: 'First recurring consultation',
        name: 'firstRecurringConsultation',
        type: 'number',
        defaultValue: data.consultations[0] as unknown as string,
      });
    }
    setEditableData(fields);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const columns = useMemo<ColumnDef<RecurringConsultationPerMunicipality>[]>(
    () => [
      {
        header: 'Municipality',
        enableHiding: false,
        accessorFn: (row) => row.companyName,
        id: 'companyName',
        size: 200,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.id}`}>
            {getValue() as string}
          </Link>
        ),
      },
      {
        header: 'Type of agreement',
        id: 'agreementType',
        accessorKey: 'agreementType',
        filterFn: 'arrIncludesSome',
        meta: {
          filterOptions: [
            { label: 'Old agreement', value: 'old' },
            { label: 'New agreement', value: 'new' },
          ],
          filterOptionsLabel: 'Type of agreement',
        },
        cell: ({ getValue }) => (getValue() === 'old' ? 'Old agreement' : 'New agreement'),
      },
      {
        header: 'Recurring consultation',
        id: 'recurringConsultation',
        accessorKey: 'recurringConsultation',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Recurring consultation',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Initial consultation signed',
        accessorKey: 'initialConsultationSignedDate',
        id: 'initialConsultationSignedDate',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Meeting 1',
        id: 'meeting1',
        accessorFn: (row) => row.consultations?.[0],
        filterFn: (row, _, filterValue) => {
          const value = row.original.consultations?.[0];
          return filterValue.includes(value);
        },
        meta: {
          filterOptionsLabel: 'Meeting 1 year',
          filterOptions: (data as LoaderResponse).yearsData.map((year) => ({
            label: year as unknown as string,
            value: year,
          })),
        },
        cell: ({ getValue }) => getValue() || '',
      },
      {
        header: 'Meeting 2',
        id: 'meeting2',
        accessorFn: (row) => row.consultations?.[1],
        filterFn: (row, _, filterValue) => {
          const value = row.original.consultations?.[1];
          return filterValue.includes(value);
        },
        meta: {
          filterOptionsLabel: 'Meeting 2 year',
          filterOptions: (data as LoaderResponse).yearsData.map((year) => ({
            label: year as unknown as string,
            value: year,
          })),
        },
        cell: ({ getValue }) => getValue() || '',
      },
      {
        header: 'Meeting 3',
        id: 'meeting3',
        accessorFn: (row) => row.consultations?.[2],
        filterFn: (row, _, filterValue) => {
          const value = row.original.consultations?.[2];
          return filterValue.includes(value);
        },
        meta: {
          filterOptionsLabel: 'Meeting 3 year',
          filterOptions: (data as LoaderResponse).yearsData.map((year) => ({
            label: year as unknown as string,
            value: year,
          })),
        },
        cell: ({ getValue }) => getValue() || '',
      },
      {
        header: 'Meeting 4',
        id: 'meeting4',
        accessorFn: (row) => row.consultations?.[3],
        filterFn: (row, _, filterValue) => {
          const value = row.original.consultations?.[3];
          return filterValue.includes(value);
        },
        meta: {
          filterOptionsLabel: 'Meeting 4 year',
          filterOptions: (data as LoaderResponse).yearsData.map((year) => ({
            label: year as unknown as string,
            value: year,
          })),
        },
        cell: ({ getValue }) => getValue() || '',
      },
      {
        header: 'Date for sending info + form',
        accessorKey: 'sentDate',
        meta: {
          filterByDate: true,
          filterOptionsLabel: 'Filter Date for sending info + form',
        },
        id: 'sentDate',
        enableSorting: false,
        filterFn: 'dateRange',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Meeting scheduled',
        accessorKey: 'meetingDate',
        id: 'meetingDate',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterByDate: true,
          filterOptionsLabel: 'Filter Meeting scheduled',
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string, 'Pp') : ''),
      },
      {
        header: 'Consultation form completed',
        accessorKey: 'consultationFormCompleted',
        filterFn: 'boolean',
        id: 'consultationFormCompleted',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Consultation form completed',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Meeting held',
        accessorKey: 'meetingHeld',
        filterFn: 'boolean',
        id: 'meetingHeld',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Meeting held',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Information shared with NPA',
        accessorKey: 'infoSharedWithAuthority',
        id: 'infoSharedWithAuthority',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Information shared with NPA',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Date shared with NPA',
        accessorKey: 'dateSharedWithAuthority',
        id: 'dateSharedWithAuthority',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterByDate: true,
          filterOptionsLabel: 'Filter Date shared with NPA',
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
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
  return (
    <PageContainer
      title="Recurring consultation"
      additionalTitleElement={
        <Stack direction="row" alignItems="center" gap={1}>
          <SendEmail />
          <FormControl>
            <InputLabel id="years-selector">Select the year</InputLabel>
            <Select
              labelId="years-selector"
              value={new URLSearchParams(location.search).get('year')}
              label="Select the year"
              onChange={(e) => navigate({ search: `?year=${e.target.value}` })}
              size="small"
            >
              {(data as { yearsData: number[]; recurringData: RecurringConsultationPerMunicipality[] }).yearsData.map(
                (year) => (
                  <MenuItem key={year} value={year}>
                    {year}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
        </Stack>
      }
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        onFilter={(rows) => setIds(rows.map((row) => row.original.id))}
        data={(data as LoaderResponse).recurringData}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>
              Requiring recurring consultation: {rows.filter((row) => row.original.agreementType === 'old').length}
            </Typography>
            <Typography>
              Information sent to municipality: {rows.filter((row) => row.original.sentDate).length}
            </Typography>
            <Typography>
              Consultation form completed: {rows.filter((row) => row.original.consultationFormCompleted).length}
            </Typography>
            <Typography>Meeting held: {rows.filter((row) => row.original.meetingHeld).length}</Typography>
          </>
        )}
      />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit recurring consultation for ${(data as LoaderResponse).recurringData?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/recurring-consultation"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
