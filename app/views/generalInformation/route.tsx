import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import { FormControl, InputLabel, Link, MenuItem, Select } from '@mui/material';
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
import { UploadButton } from '~/components/shared/UploadButton.client';
import { useEditFields } from '~/hooks/editFields';
import { auth } from '~/utils/server/auth.server';
import {
  editGeneralInformationRecord,
  GeneralInformationPerMunicipality,
  getGeneralInformationData,
} from '~/utils/server/repositories/generalInformation.server';
import { getAllYears } from '~/utils/server/repositories/years.server';

interface LoaderResponse {
  yearsData: number[];
  generalInformation: GeneralInformationPerMunicipality[];
}

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - General information' },
    { name: 'description', content: 'General information for all municipalities' },
  ];
};

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const year = new URL(request.url).searchParams.get('year');
  if (!year) {
    return redirect(`/general-information?year=${getYear(new Date())}`);
  }
  const [recurringData, yearsData] = await Promise.all([getGeneralInformationData(parseInt(year)), getAllYears(2022)]);
  if (recurringData[0] || yearsData[0]) {
    return json({ error: recurringData[0] || yearsData[0] }, { status: 500 });
  }
  return json({ generalInformation: recurringData[1], yearsData: yearsData[1] });
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
    const [error] = await editGeneralInformationRecord({
      companyId: id as string,
      year: parseInt(year as string),
      inhabitants: body.get('inhabitants') ? parseInt(body.get('inhabitants') as string) : undefined,
      landSurface: body.get('landSurface') ? parseFloat(body.get('landSurface') as string) : undefined,
      cleaningCost: body.get('cleaningCost') ? parseInt(body.get('cleaningCost') as string) : undefined,
      cleanedKg: body.get('cleanedKg') ? parseInt(body.get('cleanedKg') as string) : undefined,
      epaLitterMeasurement: body.get('epaLitterMeasurement') === 'true' ? true : undefined,
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

export default function Reporting() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();
  const navigate = useNavigate();
  const location = useLocation();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const columns = useMemo<ColumnDef<GeneralInformationPerMunicipality>[]>(
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
        header: 'Land area(km²)',
        accessorKey: 'landSurface',
        id: 'landSurface',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'Inhabitants',
        accessorKey: 'inhabitants',
        id: 'inhabitants',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'Inhabitants / km²',
        accessorKey: 'inhabitantsPerKm2',
        id: 'inhabitantsPerKm2',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'Cleaning costs',
        accessorKey: 'cleaningCost',
        id: 'cleaningCost',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'Cleaning costs / capita',
        accessorKey: 'cleaningCostsPerInhabitant',
        id: 'cleaningCostsPerInhabitant',
        enableColumnFilter: false,
      },
      {
        header: 'Cleaned up KG cigarette butts',
        accessorKey: 'cleanedKg',
        id: 'cleanedKg',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined ? Intl.NumberFormat('sv-SE').format(getValue() as number) : '',
      },
      {
        header: 'KG / CBs / capita',
        accessorKey: 'kgPerInhabitant',
        id: 'kgPerInhabitant',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() !== undefined
            ? Intl.NumberFormat('sv-SE', { minimumFractionDigits: 10 }).format(getValue() as number)
            : '',
      },
      {
        header: 'EPA littering measurement',
        accessorKey: 'epaMeasurement',
        id: 'epaMeasurement',
        enableColumnFilter: false,
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : getValue() === false ? (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ) : (
            ''
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
  const setEditableFields = useCallback((data: GeneralInformationPerMunicipality) => {
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
        label: 'Land surface (km²)',
        name: 'landSurface',
        type: 'number',
        defaultValue: data.landSurface,
      },
      {
        label: 'Inhabitants',
        name: 'inhabitants',
        type: 'number',
        defaultValue: data.inhabitants,
      },
      {
        label: 'Cleaning costs',
        name: 'cleaningCost',
        type: 'number',
        defaultValue: data.cleaningCost,
      },
      {
        label: 'Cleaned up KG cigarette butts',
        name: 'cleanedKg',
        type: 'number',
        defaultValue: data.cleanedKg,
      },
      {
        label: 'EPA littering measurement',
        name: 'epaLitterMeasurement',
        type: 'text',
        select: true,
        options: [
          { label: 'Sent', value: 'true' },
          { label: 'Not sent', value: 'false' },
          { label: 'N/A', value: undefined },
        ],
        defaultValue: data.epaMeasurement,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer
      title="General information"
      additionalTitleElement={
        <>
          <ClientOnly>
            {() => (
              <UploadButton
                search={location.search}
                title={`Upload general information data for ${new URLSearchParams(location.search).get('year')}`}
                fetcher={fetcher}
                path="/api/general-information/import"
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
      <PaginatedTable data={(data as unknown as LoaderResponse).generalInformation} columns={columns} />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit recurring consultation for ${(data as LoaderResponse).generalInformation?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/general-information"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
