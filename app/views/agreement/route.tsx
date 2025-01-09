import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import LinkIcon from '@mui/icons-material/Link';
import { IconButton, MenuItem, Stack, TextField, Tooltip } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { Field } from '~/components/EditForm';
import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { PaginatedTable } from '~/components/shared/PaginatedTable';
import { TableActionsCell } from '~/components/shared/TableActionsCell';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
import { AgreementData, editAgreementRecord, getAgreementData } from '~/utils/server/repositories/agreement.server';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Agreement stage' },
    { name: 'description', content: 'Agreement stage with all the municipalities' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'PATCH') {
    const body = await request.formData();
    const id = body.get('id');
    const typeOfAgreement = body.get('typeOfAgreement');
    if (!id || !typeOfAgreement) {
      return json(
        { message: 'Missing required fields: id or type of agreement', severity: 'error', timeStamp: new Date() },
        { status: 400 },
      );
    }
    const [error] = await editAgreementRecord({
      id: id as string,
      oldAgreementDateSigned: body.get('oldAgreementSigned') as string,
      oldAgreementDateShared: body.get('oldAgreementShared') as string,
      oldAgreementLinkToAgreement: body.get('oldAgreementLink') as string,
      oldAgreementLinkToAppendix: body.get('oldAgreementAppendix') as string,
      oldAgreementSent: body.get('oldAgreementSent') === 'true',
      newAgreementDateSigned: body.get('newAgreementSigned') as string,
      newAgreementDateShared: body.get('newAgreementShared') as string,
      newAgreementLinkToAgreement: body.get('newAgreementLink') as string,
      typeOfAgreement: typeOfAgreement as 'new' | 'old',
      newAgreementSent: body.get('newAgreementSent') === 'true',
    });

    if (error) {
      return json(
        { message: 'Could not update the record', severity: 'error', timeStamp: new Date() },
        { status: 500 },
      );
    }
    return json({ message: 'Record updated successfully', severity: 'success', timeStamp: new Date() });
  }

  return json({ status: 405 });
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const [error, data] = await getAgreementData();
  if (error) {
    return json({ error }, { status: 500 });
  }
  return json(data);
}

export default function Agreement() {
  const data = useLoaderData<typeof loader>();
  const [fields, setFields] = useState<Field[]>([]);
  const fetcher = useFetcher();

  const setEditableData = useCallback((data: AgreementData) => {
    setFields([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Type of agreement',
        name: 'typeOfAgreement',
        type: 'checkbox',
        defaultValue: data.typeOfAgreement,
        watchable: true,
        render: () => (
          <TextField select>
            <MenuItem value="new">New agreement</MenuItem>
            <MenuItem value="old">Old agreement</MenuItem>
          </TextField>
        ),
      },
      {
        label: 'Old agreement sent',
        name: 'oldAgreementSent',
        type: 'checkbox',
        defaultValue: data.oldAgreementSent,
        condition: ['typeOfAgreement', 'old'],
      },

      {
        label: 'Old agreement signed',
        name: 'oldAgreementSigned',
        type: 'date',
        defaultValue: data.oldAgreementSigned as unknown as string,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Old agreement shared with NPA',
        name: 'oldAgreementShared',
        type: 'date',
        defaultValue: data.oldAgreementShared as unknown as string,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Link to signed document',
        name: 'oldAgreementLink',
        type: 'text',
        defaultValue: data.oldAgreementLink,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Link to appendix',
        name: 'oldAgreementAppendix',
        type: 'text',
        defaultValue: data.oldAgreementAppendix,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'New agreement sent',
        name: 'newAgreementSent',
        type: 'checkbox',
        defaultValue: data.newAgreementSent,
        condition: ['typeOfAgreement', 'new'],
      },

      {
        label: 'New agreement signed',
        name: 'newAgreementSigned',
        type: 'date',
        defaultValue: data.newAgreementSigned as unknown as string,
        condition: ['typeOfAgreement', 'new'],
      },
      {
        label: 'New agreement shared with NPA',
        name: 'newAgreementShared',
        type: 'date',
        defaultValue: data.newAgreementShared as unknown as string,
        condition: ['typeOfAgreement', 'new'],
      },
      {
        label: 'Link to signed document',
        name: 'newAgreementLink',
        type: 'text',
        defaultValue: data.newAgreementLink,
        condition: ['typeOfAgreement', 'new'],
      },
    ]);
  }, []);

  const columns = useMemo<ColumnDef<AgreementData>[]>(
    () => [
      {
        header: 'Municipality',
        accessorKey: 'companyName',
        filterFn: 'includesString',
        size: 370,
        //  cell: ({ getValue, row }) => (
        //    <Link component={RLink} to={`/communes/${row.original.id}`}>
        //      {getValue() as string}
        //    </Link>
        //  ),
      },
      {
        header: 'Type of agreement',
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
        header: 'Old agreement sent',
        accessorKey: 'oldAgreementSent',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Document sent',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Old agreement agreement signed',
        accessorKey: 'isOldAgreementSigned',
        filterFn: 'boolean',
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),

        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Old agreement signed',
        },
      },
      {
        header: 'Old agreement agreement signed date',
        accessorKey: 'oldAgreementSigned',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Old agreement agreement shared',
        accessorKey: 'isOldAgreementShared',
        filterFn: 'boolean',
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),

        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Old agreement shared',
        },
      },
      {
        header: 'Old agreement shared date',
        accessorKey: 'oldAgreementShared',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'New agreement sent',
        accessorKey: 'newAgreementSent',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Document sent',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'New agreement agreement signed',
        accessorKey: 'isNewAgreementSigned',
        filterFn: 'boolean',
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),

        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'New agreement signed',
        },
      },
      {
        header: 'New agreement agreement signed date',
        accessorKey: 'newAgreementSigned',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'New agreement agreement shared',
        accessorKey: 'isNewAgreementShared',
        filterFn: 'boolean',
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),

        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'New agreement shared',
        },
      },
      {
        header: 'New agreement shared date',
        accessorKey: 'newAgreementShared',
        enableColumnFilter: false,
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },

      {
        id: 'actions',
        header: 'Actions',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) => {
          return (
            <TableActionsCell
              name={`${row.original.companyName as string} municipality`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableData(row.original)}
              link={`/communes/${row.original.companyId}`}
              additionalElement={
                row.original.newAgreementLink || row.original.oldAgreementLink ? (
                  <Stack direction="row" gap={1}>
                    {row.original.oldAgreementLink ? (
                      <Tooltip title="Avtal om den kommunala insamlingen av fimpar">
                        <IconButton component="a" href={row.original.oldAgreementLink} target="_blank" rel="noreferrer">
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {row.original.oldAgreementAppendix ? (
                      <Tooltip title="Bilaga 8.1. Ersättningsmodell ">
                        <IconButton component="a" href={row.original.oldAgreementLink} target="_blank" rel="noreferrer">
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                    {row.original.newAgreementLink ? (
                      <Tooltip title="Avtal om den kommunala insamlingen av fimpar">
                        <IconButton component="a" href={row.original.oldAgreementLink} target="_blank" rel="noreferrer">
                          <LinkIcon />
                        </IconButton>
                      </Tooltip>
                    ) : null}
                  </Stack>
                ) : null
              }
              // onDelete={(id) => {
              //   fetcher.submit({}, { method: 'DELETE', action: `/api/notes-log/${id}`, relative: 'path' });
              // }}
            />
          );
        },
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [data],
  );

  useEffect(() => {
    if (fetcher.state === 'idle' && fields.length) {
      setFields([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.state]);

  return (
    <PageContainer
      title="Agreement stage"
      additionalTitleElement={null}
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable data={data as AgreementData[]} columns={columns} />
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit agreement for ${(data as AgreementData[])?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/agreement"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
