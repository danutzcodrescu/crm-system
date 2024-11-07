import Email from '@mui/icons-material/Email';
import { IconButton, Link, Tooltip } from '@mui/material';
import { FetcherWithComponents, Link as RLink } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useMemo } from 'react';

import { Employee } from '~/utils/server/repositories/employees.server';

import { PaginatedTable } from '../shared/PaginatedTable';
import { TableActionsCell } from '../shared/TableActionsCell';

interface Props {
  data: Employee[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
  companyId: string;
}

export function EmployeesTable({ data, fetcher, companyId }: Props) {
  const columns = useMemo<ColumnDef<Employee>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        id: 'name',
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/contacts/${row.original.id}`}>
            {getValue() as string}
          </Link>
        ),
      },
      { header: 'Email', accessorKey: 'email', id: 'email', meta: { editFieldType: 'email' } },
      {
        header: 'Phone',
        accessorKey: 'phone',
        id: 'phone',
        meta: {
          editFieldType: 'phone',
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row, table }) => {
          return (
            <TableActionsCell
              name={`employee ${row.original.name}`}
              id={row.original.id as string}
              isEditable
              tableApi={table}
              row={row}
              isEditing={table.options.meta?.editedRow == row.id}
              onDelete={(id) => {
                fetcher.submit({}, { method: 'DELETE', action: `/contacts/${id}`, relative: 'path' });
              }}
            />
          );
        },
      },
    ],
    [],
  );
  return (
    <PaginatedTable
      columns={columns}
      data={data}
      action="/contacts?index"
      actionAccessor="id"
      updateFetcher={fetcher}
      // @ts-expect-error partial row data
      newRowObject={{ name: '', phone: '', email: '' }}
      createNewRow={(newRow) => (
        <>
          <Tooltip title="New contact">
            <IconButton aria-label="New contact" onClick={newRow}>
              <Email />
            </IconButton>
          </Tooltip>
          <input type="hidden" name="companyId" value={companyId} />
        </>
      )}
    ></PaginatedTable>
  );
}
