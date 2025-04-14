import AddAlarm from '@mui/icons-material/AddAlarm';
import Alarm from '@mui/icons-material/Alarm';
import PostAdd from '@mui/icons-material/PostAdd';
import { Box, IconButton, Stack, Tooltip, Typography } from '@mui/material';
import { useFetcher } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { isAfter } from 'date-fns';
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
        accessorFn: (row) => (row.date ? new Date(row.date as unknown as string) : ''),
        cell: ({ getValue }) => formatDate(getValue() as string),
        meta: {
          filterOptionsLabel: 'log date',
          filterByDate: true,
        },
        size: 140,
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
        header: 'Reminder',
        id: 'reminderDate',
        accessorFn: (row) => (row.reminderDueDate ? new Date(row.reminderDueDate as unknown as string) : ''),
        sortUndefined: 'last',
        size: 140,
        meta: {
          filterOptionsLabel: 'Reminder date',
          filterByDate: true,
        },
        filterFn: 'dateRange',
        cell: ({ row }) => {
          if (!row.original.reminderId) {
            return '';
          }
          return (
            <Stack direction="row" gap={1} alignItems="center">
              <Alarm
                color={
                  isAfter(new Date(row.original.reminderDueDate as unknown as string), new Date()) ? 'primary' : 'error'
                }
              />
              <Tooltip title={row.original.reminderDescription}>
                <Typography variant="body2" component="span">
                  {formatDate(row.original.reminderDueDate as unknown as string)}
                </Typography>
              </Tooltip>
            </Stack>
          );
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        enableHiding: false,
        size: 130,
        cell: ({ row }) => {
          return (
            <TableActionsCell
              name={`log`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
              additionalElement={
                !row.original.reminderId ? (
                  <Tooltip title="Add reminder">
                    <IconButton
                      onClick={() => setNewReminderFields(row.original)}
                      size="small"
                      aria-label="Add reminder"
                    >
                      <AddAlarm />
                    </IconButton>
                  </Tooltip>
                ) : undefined
              }
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
      {
        label: 'Reminder due date',
        name: 'reminderDueDate',
        type: 'date',
      },
      {
        label: 'Reminder description',
        name: 'reminderDescription',
        type: 'text',
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
      {
        label: 'Reminder due date',
        name: 'reminderDueDate',
        type: 'date',
        defaultValue: data.reminderDueDate as unknown as string,
      },
      {
        label: 'Reminder status',
        name: 'reminderStatus',
        type: 'text',
        select: true,
        defaultValue: data.reminderStatus?.toString() || undefined,
        options: [
          { label: 'Not completed', value: 'false' },
          { label: 'Completed', value: 'true' },
        ],
      },
      {
        label: 'Reminder description',
        name: 'reminderDescription',
        type: 'text',
        multiline: true,
        defaultValue: data.reminderDescription as unknown as string,
      },

      {
        label: 'Reminder id',
        name: 'reminderId',
        type: 'text',
        defaultValue: data.reminderId as unknown as string,
        hidden: true,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setNewReminderFields = useCallback(
    (data: LogForCompany) => {
      setEditableData([
        {
          label: 'logId',
          name: 'logId',
          hidden: true,
          type: 'text',
          defaultValue: data.id,
        },
        {
          label: 'companyId',
          name: 'companyId',
          hidden: true,
          type: 'text',
          defaultValue: companyId,
        },
        {
          label: 'Due date',
          name: 'date',
          type: 'date',
          required: true,
          defaultValue: new Date() as unknown as string,
        },
        {
          label: 'Description',
          name: 'description',
          type: 'text',
          multiline: true,
        },
      ]);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [companyId],
  );

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
        <PaginatedTable
          tableHeight="950px"
          defaultPageSize={5}
          defaultSorting={{ id: 'date', desc: true }}
          columns={columns}
          data={data}
        />
      </Box>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={
              fields?.[0]?.name === 'logId'
                ? 'Add reminder to log'
                : fields?.[0]?.name === 'companyId'
                  ? 'Add log'
                  : `Edit log`
            }
            fetcher={fetcher}
            method={fields?.[0]?.name === 'companyId' || fields?.[0]?.name === 'logId' ? 'POST' : 'PATCH'}
            url={
              fields[0]?.name === 'logId'
                ? `/api/municipalities/${companyId}/reminders`
                : fields?.[0]?.name === 'companyId'
                  ? `/api/logs/${companyId}`
                  : `/api/logs/${companyId}/${fields[0]?.defaultValue as string}`
            }
          />
        )}
      </ClientOnly>
    </>
  );
}
