import CalendarMonth from '@mui/icons-material/CalendarMonth';
import DownloadDone from '@mui/icons-material/DownloadDone';
import { Box, IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Employee } from '~/utils/server/repositories/employees.server';
import { Reminder } from '~/utils/server/repositories/reminders.server';

import { PaginatedTable } from '../shared/PaginatedTable';
import { TableActionsCell } from '../shared/TableActionsCell';

interface Props {
  data: Reminder[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
  employees: Employee[];
  companyId: string;
}

export function RemindersTable({ data, fetcher, employees, companyId }: Props) {
  const columns = useMemo<ColumnDef<Reminder>[]>(
    () => [
      {
        header: 'Date',
        id: 'date',
        accessorKey: 'date',
        enableColumnFilter: false,
        cell: ({ getValue }) => <>{dayjs(new Date(getValue() as string)).format('L')}</>,
      },
      {
        header: 'Contact',
        id: 'contact',
        accessorKey: 'employeeName',
        width: 300,
        meta: {
          editField: ({ row }) => (
            <Select defaultValue={row.original.employeeId || ''} name="employeeId" displayEmpty>
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
              name={`reminder ${row.original.date?.toString() as string}`}
              id={row.original.id as string}
              isEditable
              tableApi={table}
              row={row}
              isEditing={table.options.meta?.editedRow == row.id}
              onDelete={(id) => {
                fetcher.submit({}, { method: 'DELETE', action: `/api/reminders/${id}`, relative: 'path' });
              }}
              additionalElement={
                <Tooltip title="Complete task">
                  <IconButton
                    aria-label="Complete task"
                    onClick={() =>
                      fetcher.submit(
                        {
                          date: row.original.date,
                          employeeId: row.original.employeeId,
                          companyId,
                          description: row.original.description,
                          completed: true,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        } as any,
                        { method: 'PATCH', action: `/api/reminders/${row.original.id}`, relative: 'path' },
                      )
                    }
                  >
                    <DownloadDone sx={{ color: (theme) => theme.palette.success.main }} />
                  </IconButton>
                </Tooltip>
              }
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
        action="/api/reminders"
        actionAccessor="id"
        updateFetcher={fetcher}
        newRowObject={{ date: new Date(), description: '', employeeId: '' } as unknown as Reminder}
        warningMessage="Follow up is overdue!"
        createNewRow={(newRow) => (
          <>
            <Tooltip title="New reminder">
              <IconButton aria-label="New reminder" onClick={newRow}>
                <CalendarMonth />
              </IconButton>
            </Tooltip>
            <input type="hidden" name="type" value="reminder" />
            <input type="hidden" name="companyId" value={companyId} />
          </>
        )}
      />
    </Box>
  );
}
