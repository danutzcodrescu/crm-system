import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import { FormControl, InputLabel, Link, MenuItem, Select, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, useLoaderData, useLocation, useNavigate } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { getYear } from 'date-fns';
import { useMemo } from 'react';

import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { auth } from '~/utils/server/auth.server';
import { CompensationData, getCompensationByYear } from '~/utils/server/repositories/compensation.server';
import { getAllYears } from '~/utils/server/repositories/years.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Compensation' },
    { name: 'description', content: 'Compensation information for all municipalities' },
  ];
};

interface LoaderResponse {
  yearsData: number[];
  compensationData: CompensationData[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const year = new URL(request.url).searchParams.get('year');
  if (!year) {
    return redirect(`/compensation?year=${getYear(new Date()) - 1}`);
  }
  const [compensationData, yearsData] = await Promise.all([getCompensationByYear(parseInt(year)), getAllYears(2023)]);
  if (compensationData[0] || yearsData[0]) {
    return json({ error: compensationData[0] || yearsData[0] }, { status: 500 });
  }
  return json({ compensationData: compensationData[1], yearsData: yearsData[1] });
}

export default function Compensation() {
  const data = useLoaderData<typeof loader>();
  const location = useLocation();
  const navigate = useNavigate();
  const columns = useMemo<ColumnDef<CompensationData>[]>(
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
        header: 'Type of agreement',
        id: 'typeOfAgreement',
        accessorKey: 'typeOfAgreement',
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
        header: `Inhabitants ${new URLSearchParams(location.search).get('year')}`,
        id: 'inhabitants',
        accessorKey: 'inhabitants',
        enableColumnFilter: false,
      },
      {
        header: `Variable compensation`,
        id: 'variableCompensation',
        accessorKey: 'variableCompensation',
        enableColumnFilter: false,
      },

      {
        header: `Addition to fixed compensation`,
        id: 'totalAddition',
        accessorKey: 'totalAddition',
        enableColumnFilter: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(getValue() as number),
      },
      {
        header: `Change factor CPI (old + new)`,
        id: 'changeFactor',
        accessorKey: 'changeFactor',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(getValue() as number),
      },
      {
        header: `Change factor litter (old)`,
        id: 'changeFactorLitter',
        accessorKey: 'changeFactorLitter',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(getValue() as number),
      },
      {
        header: `Total compensation (old)`,
        id: 'totalCompensationOld',
        accessorKey: 'totalCompensationOld',
        enableColumnFilter: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2 }).format(getValue() as number),
      },
      {
        header: `Total compensation (new)`,
        id: 'totalCompensationNew',
        accessorKey: 'totalCompensationNew',
        enableColumnFilter: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { minimumFractionDigits: 2 }).format(getValue() as number),
      },
      {
        header: `Total compensation`,
        id: 'totalCompensation',
        accessorKey: 'totalCompensation',
        enableColumnFilter: false,
        cell: ({ getValue }) => Intl.NumberFormat('sv-SE', { maximumFractionDigits: 2 }).format(getValue() as number),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [(data as LoaderResponse).yearsData],
  );

  return (
    <PageContainer
      title="Compensation"
      additionalTitleElement={
        <FormControl>
          <InputLabel id="years-selector">Select the year</InputLabel>
          <Select
            labelId="years-selector"
            value={new URLSearchParams(location.search).get('year')}
            label="Select the year"
            onChange={(e) => navigate({ search: `?year=${e.target.value}` })}
          >
            {(data as LoaderResponse).yearsData.map((year) => (
              <MenuItem key={year} value={year}>
                {year}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      }
    >
      <PaginatedTable
        data={(data as LoaderResponse).compensationData}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>In agreement: {rows.filter((row) => row.original.inAgreement).length}</Typography>
            <Typography>
              Total inhabitants:{' '}
              {Intl.NumberFormat('sv-SE').format(rows.reduce((acc, row) => acc + row.original.inhabitants, 0))}
            </Typography>
            <Typography>
              Variable compensation:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, row) => acc + parseFloat(row.original.variableCompensation as unknown as string), 0),
              )}
            </Typography>
            <Typography>
              Additional fixed compensation:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, row) => acc + parseFloat(row.original.totalAddition as unknown as string), 0),
              )}
            </Typography>
            <Typography>
              All old agreements:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, row) => {
                  if (row.original.typeOfAgreement === 'old' && row.original.inAgreement) {
                    return acc + parseFloat(row.original.totalCompensationOld as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
            <Typography>
              All new agreements:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, row) => {
                  if (row.original.typeOfAgreement === 'new' && row.original.inAgreement) {
                    return acc + parseFloat(row.original.totalCompensationNew as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
            <Typography>
              All compensation:{' '}
              {Intl.NumberFormat('sv-SE').format(
                rows.reduce((acc, row) => {
                  if (row.original.typeOfAgreement === 'new' && row.original.inAgreement) {
                    return acc + parseFloat(row.original.totalCompensationNew as unknown as string);
                  }
                  if (row.original.typeOfAgreement === 'old' && row.original.inAgreement) {
                    return acc + parseFloat(row.original.totalCompensationOld as unknown as string);
                  }
                  return acc;
                }, 0),
              )}
            </Typography>
          </>
        )}
      />
    </PageContainer>
  );
}
