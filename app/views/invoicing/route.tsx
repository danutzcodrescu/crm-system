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
import { booleanFilterFn } from '~/components/shared/table/filters';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { UploadButton } from '~/components/shared/UploadButton.client';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
import {
  editInvoicingRecord,
  getInvoicingDataByYear,
  InvoicingData,
} from '~/utils/server/repositories/invoicing.server';
import { getAllYears } from '~/utils/server/repositories/years.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Invoicing' },
    { name: 'description', content: 'Invoicing information for all municipalities' },
  ];
};

interface LoaderResponse {
  yearsData: number[];
  invoicingData: InvoicingData[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const year = new URL(request.url).searchParams.get('year');
  if (!year) {
    return redirect(`/invoicing?year=${getYear(new Date()) - 1}`);
  }
  const [invoicingData, yearsData] = await Promise.all([getInvoicingDataByYear(parseInt(year)), getAllYears(2023)]);
  if (invoicingData[0] || yearsData[0]) {
    return json({ error: invoicingData[0] || yearsData[0] }, { status: 500 });
  }
  return json({ invoicingData: invoicingData[1], yearsData: yearsData[1] });
}

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
    const [error] = await editInvoicingRecord({
      companyId: id as string,
      year: parseInt(year as string),
      // @ts-expect-error - we know that the values are strings
      invoiceDate: body.get('invoiceDate'),
      vat: body.get('vat') ? parseFloat(body.get('vat') as string) : 0,
      // @ts-expect-error - we know that the values are strings
      datePaid: body.get('datePaid'),
      invoiceAmount: body.get('invoiceAmount') ? parseFloat(body.get('invoiceAmount') as string) : 0,
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

export default function Invoicing() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const columns = useMemo<ColumnDef<InvoicingData>[]>(
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
         
      },
      {
        header: 'Total compensation',
        accessorKey: 'totalCompensation',
        id: 'totalCompensation',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'In agreement',
        id: 'inAgreement',
        accessorKey: 'inAgreement',
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
        header: 'Entitled',
        id: 'entitled',
        accessorKey: 'entitled',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filterFn: (row, _, filterValue, addMeta) => booleanFilterFn(row as any, 'entitled', filterValue, addMeta),
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
        header: 'Eligible amount',
        accessorKey: 'inAgreement',
        id: 'eligibleAmount',
        enableColumnFilter: false,
        cell: ({ getValue, row }) => Intl.NumberFormat('sv-SE').format(getValue() ? row.original.totalCompensation : 0),
      },
      {
        header: 'Invoice received from municipality',
        id: 'invoiceReceived',
        accessorKey: 'invoiceReceived',
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
        header: 'Invoice date',
        accessorKey: 'invoiceDate',
        id: 'invoiceDate',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
      },
      {
        header: 'Invoice paid by SUP suplier',
        id: 'invoicePaid',
        accessorKey: 'invoicePaid',
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
        header: 'Date paid',
        accessorKey: 'datePaid',
        id: 'datePaid',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        filterFn: 'dateRange',
      },
      {
        header: 'Amount paid out excluding VAT',
        accessorKey: 'invoiceAmount',
        id: 'invoiceAmount',
        enableColumnFilter: false,
        cell: ({ getValue, row }) => Intl.NumberFormat('sv-SE').format(getValue() ? row.original.invoiceAmount : 0),
      },
      {
        header: 'VAT not paid out',
        accessorKey: 'vat',
        id: 'vat',
        enableColumnFilter: false,
        cell: ({ getValue, row }) => Intl.NumberFormat('sv-SE').format(getValue() ? row.original.vat : 0),
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
    [location.search],
  );
  const setEditableFields = useCallback((data: InvoicingData) => {
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
        label: 'Invoice date',
        name: 'invoiceDate',
        type: 'date',
        defaultValue: data.invoiceDate as unknown as string,
      },
      {
        label: 'Time for paying the invoice ',
        name: 'datePaid',
        type: 'date',
        defaultValue: data.datePaid as unknown as string,
      },
      {
        label: 'Amount paid out excluding VAT',
        name: 'invoiceAmount',
        type: 'number',
        defaultValue: data.invoiceAmount,
        inputProps: { step: '0.01' },
      },
      {
        label: 'Vat not paid out',
        name: 'vat',
        type: 'number',
        defaultValue: data.vat,
        inputProps: { step: '0.01' },
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <PageContainer
      title="Invoicing"
      additionalTitleElement={
        <>
          <ClientOnly>
            {() => (
              <UploadButton
                search={location.search}
                title={`Upload invoicing data for ${new URLSearchParams(location.search).get('year')}}`}
                fetcher={fetcher}
                path="/api/invoicing/import"
              />
            )}
          </ClientOnly>
          <FormControl>
            <InputLabel id="years-selector">Select the year</InputLabel>
            <Select
              labelId="years-selector"
              value={new URLSearchParams(location.search).get('year')}
              label="Select the year"
              onChange={(e) => navigate({ search: `?year=${e.target.value}` })}
              size="small"
            >
              {(data as unknown as LoaderResponse).yearsData.map((year) => (
                <MenuItem key={year} value={year}>
                  {year}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </>
      }
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        data={(data as unknown as LoaderResponse).invoicingData}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>In agreement: {rows.filter((row) => row.original.inAgreement).length}</Typography>
            <Typography>
              Eligible amount:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, val) => {
                  if (val.original.inAgreement) {
                    return acc + parseFloat(val.original.totalCompensation as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
            <Typography>Invoices received: {rows.filter((row) => row.original.invoiceReceived).length}</Typography>
            <Typography>Invoices paid: {rows.filter((row) => row.original.invoicePaid).length}</Typography>
            <Typography>
              Amount paid without VAT:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, val) => {
                  if (val.original.invoicePaid && val.original.invoiceAmount) {
                    return acc + parseFloat(val.original.invoiceAmount as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
            <Typography>
              VAT not paid:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, val) => {
                  if (val.original.invoicePaid && val.original.vat) {
                    return acc + parseFloat(val.original.vat as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
          </>
        )}
      />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit recurring consultation for ${(data as unknown as LoaderResponse)?.invoicingData?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/invoicing"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
