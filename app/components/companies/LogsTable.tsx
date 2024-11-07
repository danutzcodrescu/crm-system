import Email from '@mui/icons-material/Email';
import { Box, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Employee } from '~/utils/server/repositories/employees.server';
import { LogForCompany } from '~/utils/server/repositories/notes-log.server';

import { PaginatedTable } from '../shared/PaginatedTable';
import { TableActionsCell } from '../shared/TableActionsCell';

interface Props {
  data: LogForCompany[];
  employees: Employee[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function LogsTable({ data, employees, fetcher }: Props) {
  const columns = useMemo<ColumnDef<LogForCompany>[]>(
    () => [
      {
        header: 'Date',
        id: 'date',
        accessorKey: 'date',
        enableColumnFilter: false,
        cell: ({ getValue }) => <>{dayjs(new Date(getValue() as string)).format('L')}</>,
        width: 150,
      },
      {
        header: 'Contact',
        id: 'contact',
        accessorKey: 'employeeName',
        width: 350,
        meta: {
          editField: ({ row }) => (
            <Select defaultValue={row.original.employeeId || ''} name="employeeId" fullWidth displayEmpty>
              <MenuItem value="" disabled>
                Employee
              </MenuItem>
              {employees.map((employee) => (
                <MenuItem key={employee.id} value={employee.id}>
                  {employee.name}
                </MenuItem>
              ))}
            </Select>
          ),
        },
      },
      {
        header: 'Description',
        id: 'description',
        accessorKey: 'description',
        enableSorting: false,
        meta: {
          editFieldType: 'textarea',
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
              name={`log ${row.original.date?.toString() as string}`}
              id={row.original.id as string}
              isEditable
              tableApi={table}
              row={row}
              isEditing={table.options.meta?.editedRow == row.id}
              onDelete={(id) => {
                fetcher.submit({}, { method: 'DELETE', action: `/api/notes-log/${id}`, relative: 'path' });
              }}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  return (
    <Box sx={{ width: '100%' }}>
      <PaginatedTable
        columns={columns}
        data={data}
        action="/api/notes-log"
        actionAccessor="id"
        updateFetcher={fetcher}
        newRowObject={{ date: new Date(), description: '', employeeId: '' } as unknown as LogForCompany}
        createNewRow={(newRow) => (
          <>
            <Tooltip title="New log">
              <IconButton aria-label="New log" onClick={newRow}>
                <Email />
              </IconButton>
            </Tooltip>
          </>
        )}
      />
    </Box>
  );
}
