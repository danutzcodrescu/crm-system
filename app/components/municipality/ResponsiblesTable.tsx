import { Link } from '@mui/material';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { ResponsibleData } from '~/utils/server/repositories/responsibles.server';

import { PaginatedTable } from '../shared/table/PaginatedTable';

interface Props {
  data: ResponsibleData[];
  companyId: string;
}

export function ResponsiblesTable({ data }: Props) {
  const columns = useMemo<ColumnDef<ResponsibleData>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'email',
        id: 'name',
        enableColumnFilter: false,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        id: 'title',
        enableColumnFilter: false,
        enableSorting: false,
      },

      {
        header: 'Email',
        accessorKey: 'email',
        enableColumnFilter: false,
        id: 'email',
        cell: ({ getValue }) => <Link href={`mailto:${getValue() as string}`}>{getValue() as string}</Link>,
        enableSorting: false,
      },
      {
        header: 'Phone',
        enableColumnFilter: false,
        enableSorting: false,
        accessorKey: 'phone',
        id: 'phone',
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );
  return <PaginatedTable disablePagination hideHeader columns={columns} data={data} />;
}
