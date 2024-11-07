import CalendarMonth from '@mui/icons-material/CalendarMonth';
import { Box, IconButton, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { useMemo } from 'react';

import { Reminder } from '~/utils/server/repositories/reminders.server';

import { PaginatedTable } from '../shared/PaginatedTable';
import { TableActionsCell } from '../shared/TableActionsCell';

interface Props {
  data: Reminder[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
  companyId: string;
}
export function MeetingsTable({ data, fetcher, companyId }: Props) {
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
        newRowObject={{ date: new Date(), description: '' } as unknown as Reminder}
        createNewRow={(newRow) => (
          <>
            <Tooltip title="New meeting">
              <IconButton aria-label="New meeting" onClick={newRow}>
                <CalendarMonth />
              </IconButton>
            </Tooltip>
            <input type="hidden" name="type" value="meeting" />
            <input type="hidden" name="companyId" value={companyId} />
            <input type="hidden" name="completed" value="false" />
          </>
        )}
      />
    </Box>
  );
}
