import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import { FormControl, InputLabel, MenuItem, Select } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { getYear } from 'date-fns';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/PaginatedTable';
import { TableActionsCell } from '~/components/shared/TableActionsCell';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
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

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Recurring consultation' },
    { name: 'description', content: 'Recurring consultation stage with all the municipalities' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
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
  if (!auth.isLoggedIn(request)) {
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
        meetingHeld: body.get('meetingHeld') === 'true',
        // @ts-expect-error - we know that these values are strings
        dateSharedWithAuthority: body.get('dateSharedWithAuthority') as string,
      }),
    ];
    if (body.get('firstRecurringConsultation')) {
      const newYear = parseInt(body.get('firstRecurringConsultation') as string);
      const [_, consultationYear] = await getFistRecurringConsultationYearFormCompany(id as string);
      if (consultationYear !== newYear) {
        promises.push(updateRecurringConsultations(id as string, [newYear, newYear + 2, newYear + 4, newYear + 6]));
      }
    }
    const [consultation, municipality] = await Promise.all(promises);

    if (consultation[0] || municipality[0]) {
      return json(
        { message: 'Could not update the record', severity: 'error', timeStamp: new Date() },
        { status: 500 },
      );
    }
    return json({ message: 'Record updated successfully', severity: 'success', timeStamp: new Date() });
  }

  return json({ status: 405 });
}

export default function RecurringConsultation() {
  const location = useLocation();
  const navigate = useNavigate();
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
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
        type: 'checkbox',
        defaultValue: data.consultationFormCompleted as boolean,
      },
      {
        label: 'Meeting held',
        name: 'meetingHeld',
        type: 'checkbox',
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
        accessorFn: (row) => row.companyName,
        size: 370,
        //  cell: ({ getValue, row }) => (
        //    <Link component={RLink} to={`/communes/${row.original.id}`}>
        //      {getValue() as string}
        //    </Link>
        //  ), },
      },
      {
        header: 'Type of agreement',
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
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Meeting 1',
        id: 'meeting1',
        accessorKey: 'consultations',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => ((getValue() as number[]).length ? (getValue() as number[])[0] : ''),
      },
      {
        header: 'Meeting 2',
        id: 'meeting2',
        accessorKey: 'consultations',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => ((getValue() as number[]).length ? (getValue() as number[])[1] : ''),
      },
      {
        header: 'Meeting 3',
        id: 'meeting3',
        accessorKey: 'consultations',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => ((getValue() as number[]).length ? (getValue() as number[])[2] : ''),
      },
      {
        header: 'Meeting 4',
        id: 'meeting4',
        accessorKey: 'consultations',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => ((getValue() as number[]).length ? (getValue() as number[])[3] : ''),
      },
      {
        header: 'Date for sending info + form',
        accessorKey: 'sentDate',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Meeting scheduled',
        accessorKey: 'meetingDate',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string, 'Pp') : ''),
      },
      {
        header: 'Consultation form completed',
        accessorKey: 'consultationFormCompleted',
        filterFn: 'boolean',
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
        filterFn: 'boolean',
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
        header: 'Date shared with NPA',
        accessorKey: 'dateSharedWithAuthority',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          return (
            <TableActionsCell
              name={`${row.original.companyName as string} municipality`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
              link={`/communes/${row.original.id}`}
            />
          );
        },
      },
    ],
    [],
  );
  return (
    <PageContainer
      title="Recurring consultation"
      additionalTitleElement={
        <FormControl>
          <InputLabel id="years-selector">Select the year</InputLabel>
          <Select
            labelId="years-selector"
            value={new URLSearchParams(location.search).get('year')}
            label="Select the year"
            onChange={(e) => navigate({ search: `?year=${e.target.value}` })}
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
      }
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        data={(data as { yearsData: number[]; recurringData: RecurringConsultationPerMunicipality[] }).recurringData}
        columns={columns}
      />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit recurring consultation for ${(data as { yearsData: number[]; recurringData: RecurringConsultationPerMunicipality[] }).recurringData?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/recurring-consultation"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
