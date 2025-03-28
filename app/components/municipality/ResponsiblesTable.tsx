import PersonAdd from '@mui/icons-material/PersonAdd';
import { Box, IconButton, Link, Stack, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useMemo } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { ResponsibleData } from '~/utils/server/repositories/responsibles.server';

import { DeleteButton } from '../shared/DeleteButton';
import { EditDialog } from '../shared/EditDialog.client';
import { PaginatedTable } from '../shared/table/PaginatedTable';
import { TableActionsCell } from '../shared/table/TableActionsCell';

interface Props {
  data: ResponsibleData[];
  companyId: string;
  fetcher: FetcherWithComponents<unknown>;
}

export function ResponsiblesTable({ data, companyId, fetcher }: Props) {
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
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        <PaginatedTable defaultSorting={{ id: 'name', desc: false }} disablePagination columns={columns} data={data} />
      </Box>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={fields?.[0]?.name === 'companyId' ? 'Add responsible' : `Edit responsible`}
            fetcher={fetcher}
            method={fields?.[0]?.name === 'companyId' ? 'POST' : 'PATCH'}
            url={
              fields?.[0]?.name === 'companyId'
                ? `/api/municipalities/${companyId}/responsibles`
                : `/api/municipalities/${companyId}/responsibles/${fields[0]?.defaultValue as string}`
            }
          />
        )}
      </ClientOnly>
    </>
  );
}
