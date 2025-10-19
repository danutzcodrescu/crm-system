import Edit from '@mui/icons-material/Edit';
import PersonAdd from '@mui/icons-material/PersonAdd';
import { Box, IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { ResponsibleData } from '~/utils/server/repositories/responsibles.server';

import { DeleteButton } from '../shared/DeleteButton';
import { EditDialog } from '../shared/EditDialog.client';
import { PaginatedTable } from '../shared/table/PaginatedTable';
import { TableActionsCell } from '../shared/table/TableActionsCell';

interface Props {
  data: ResponsibleData[];
  companyId: string;
  fetcher: FetcherWithComponents<unknown>;
  infoVerified?: string;
}

export function ResponsiblesTable({ data, companyId, fetcher, infoVerified }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const columns = useMemo<ColumnDef<ResponsibleData>[]>(
    () => [
      {
        header: 'Name',
        accessorKey: 'name',
        id: 'name',
        enableColumnFilter: false,
      },
      {
        header: 'Updated',
        accessorFn: (row) => (row.updatedAt ? new Date(row.updatedAt) : null),
        id: 'updatedAt',
        enableColumnFilter: false,
        hidden: true,
      },
      {
        header: 'Title',
        accessorKey: 'title',
        id: 'title',
        enableColumnFilter: false,
        enableSorting: false,
        size: 140,
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
        accessorKey: 'phoneNumber',
        id: 'phoneNumber',
        size: 130,
      },
      {
        header: 'Mobile',
        enableColumnFilter: false,
        enableSorting: false,
        accessorKey: 'mobileNumber',
        id: 'mobileNumber',
        size: 130,
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
              name={`responsible`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableFields(row.original)}
              additionalElement={
                <DeleteButton
                  title="responsible"
                  onClick={() =>
                    fetcher.submit(
                      {},
                      { method: 'DELETE', action: `/api/municipalities/${companyId}/responsibles/${row.original.id}` },
                    )
                  }
                />
              }
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  const setNewResponsibleFields = useCallback(() => {
    setEditableData([
      {
        label: 'companyId',
        name: 'companyId',
        type: 'text',
        defaultValue: companyId,
        hidden: true,
      },
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Title',
        name: 'title',
        type: 'text',
      },
      {
        label: 'Email',
        name: 'email',
        type: 'email',
      },
      {
        label: 'Phone',
        name: 'phoneNumber',
        type: 'tel',
      },
      {
        label: 'Mobile',
        name: 'mobileNumber',
        type: 'tel',
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const setEditableFields = useCallback((data: ResponsibleData) => {
    setEditableData([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
        defaultValue: data.name,
      },
      {
        label: 'Title',
        name: 'title',
        type: 'text',
        defaultValue: data.title,
      },
      {
        label: 'Email',
        name: 'email',
        type: 'email',
        defaultValue: data.email,
      },
      {
        label: 'Phone',
        name: 'phoneNumber',
        type: 'tel',
        defaultValue: data.phoneNumber,
      },
      {
        label: 'Mobile',
        name: 'mobileNumber',
        type: 'tel',
        defaultValue: data.mobileNumber,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setContactVerificationFields = useCallback(() => {
    setEditableData([
      {
        label: 'Info verified',
        name: 'infoVerified',
        type: 'date',
        defaultValue: infoVerified,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [infoVerified]);

  return (
    <>
      <Stack direction="row" gap={1} alignItems="center" justifyContent="space-between">
        <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold', flex: 1 }} gutterBottom>
          Responsibles
        </Typography>
        <IconButton size="small" aria-label="Add new responsible" onClick={() => setNewResponsibleFields()}>
          <PersonAdd />
        </IconButton>
      </Stack>
      <Box sx={{ minWidth: 650 }}>
        <PaginatedTable
          tableHeight="950px"
          defaultPageSize={10}
          defaultSorting={{ id: 'updatedAt', desc: true }}
          disablePagination
          columns={columns}
          data={data}
        />
      </Box>
      <Stack direction="row" gap={1} alignItems="center" sx={{ mt: 2 }}>
        <Typography variant="body2" component="p">
          Last verification date:{' '}
          <Box component="span" sx={{ fontWeight: 'bold' }}>
            {infoVerified ? formatDate(infoVerified) : 'No date set'}
          </Box>
        </Typography>
        <Tooltip title="Edit last verification date">
          <IconButton
            size="small"
            aria-label="Edit last verification date"
            onClick={() => setContactVerificationFields()}
          >
            <Edit />
          </IconButton>
        </Tooltip>
      </Stack>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={
              fields[0]?.name === 'infoVerified'
                ? 'Edit last verification date'
                : fields?.[0]?.name === 'companyId'
                  ? 'Add responsible'
                  : `Edit responsible`
            }
            fetcher={fetcher}
            method={fields?.[0]?.name === 'companyId' ? 'POST' : 'PATCH'}
            url={
              fields?.[0]?.name === 'infoVerified'
                ? `/api/municipalities/${companyId}`
                : fields?.[0]?.name === 'companyId'
                  ? `/api/municipalities/${companyId}/responsibles`
                  : `/api/municipalities/${companyId}/responsibles/${fields[0]?.defaultValue as string}`
            }
          />
        )}
      </ClientOnly>
    </>
  );
}
