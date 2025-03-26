import PostAdd from '@mui/icons-material/PostAdd';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useFetcher } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { LogForCompany } from '~/utils/server/repositories/notes-log.server';

import { EditDialog } from '../shared/EditDialog.client';
import { PaginatedTable } from '../shared/table/PaginatedTable';
import { TableActionsCell } from '../shared/table/TableActionsCell';

interface Props {
  data: LogForCompany[];
  companyId: string;
  fetcher: ReturnType<typeof useFetcher>;
}

export function LogsTable({ data, companyId, fetcher }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const columns = useMemo<ColumnDef<LogForCompany>[]>(
    () => [
      {
        header: 'Date',
        id: 'date',
        accessorKey: 'date',
        cell: ({ getValue }) => formatDate(getValue() as string),
        meta: {
          filterOptionsLabel: 'log date',
          filterByDate: true,
        },
        filterFn: 'dateRange',
      },
      {
        header: 'Description',
        id: 'description',
        accessorKey: 'description',
        size: 500,
        enableColumnFilter: false,
        enableSorting: false,
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
              name={`log`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const setNewLogFields = useCallback(() => {
    setEditableData([
      {
        label: 'companyId',
        name: 'companyId',
        type: 'text',
        defaultValue: companyId,
        hidden: true,
      },
      {
        label: 'Date',
        name: 'date',
        type: 'date',
        required: true,
        defaultValue: new Date() as unknown as string,
      },
      {
        label: 'Description',
        name: 'description',
        type: 'text',
        required: true,
        multiline: true,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const setEditableFields = useCallback((data: LogForCompany) => {
    setEditableData([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Date',
        name: 'date',
        type: 'date',
        required: true,
        defaultValue: data.date as unknown as string,
      },
      {
        label: 'Description',
        name: 'description',
        type: 'text',
        required: true,
        multiline: true,
        defaultValue: data.description,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <>
      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }} gutterBottom>
          Logs
        </Typography>
        <Tooltip title="Add new log">
          <IconButton size="small" aria-label="Add new log" onClick={() => setNewLogFields()}>
            <PostAdd />
          </IconButton>
        </Tooltip>
      </Stack>
      <Box sx={{ minWidth: 650 }}>
        <PaginatedTable defaultSorting={{ id: 'date', desc: true }} columns={columns} data={data} />
      </Box>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={fields?.[0]?.name === 'companyId' ? 'Add log' : `Edit log`}
            fetcher={fetcher}
            method={fields?.[0]?.name === 'companyId' ? 'POST' : 'PATCH'}
            url={
              fields?.[0]?.name === 'companyId'
                ? `/api/logs/${companyId}`
                : `/api/logs/${companyId}/${fields[0]?.defaultValue as string}`
            }
          />
        )}
      </ClientOnly>
    </>
  );
}
