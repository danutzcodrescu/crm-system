import LinkAddIcon from '@mui/icons-material/AddLink';
import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import LinkIcon from '@mui/icons-material/Link';
import { IconButton, Link, Stack, Tooltip, Typography } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, ShouldRevalidateFunctionArgs, useFetcher, useLoaderData } from '@remix-run/react';
import { ColumnDef } from '@tanstack/react-table';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { Field } from '~/components/EditForm';
import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { SendEmail } from '~/components/shared/SendEmail';
import { PaginatedTable } from '~/components/shared/table/PaginatedTable';
import { TableActionsCell } from '~/components/shared/table/TableActionsCell';
import { formatDate } from '~/utils/client/dates';
import { isLoggedIn } from '~/utils/server/auth.server';
import { AgreementData, editAgreementRecord, getAgreementData } from '~/utils/server/repositories/agreement.server';
import { useIds } from '~/utils/store';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Agreement stage' },
    { name: 'description', content: 'Agreement stage with all the municipalities' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (!isLoggedIn(request)) {
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
      typeOfAgreement: typeOfAgreement as 'new' | 'old',
      ...(typeOfAgreement === 'old'
        ? {
            oldAgreementDateSigned: body.get('oldAgreementSigned') as string,
            oldAgreementDateShared: body.get('oldAgreementShared') as string,
            oldAgreementLinkToAgreement: body.get('oldAgreementLink') as string,
            oldAgreementLinkToAppendix: body.get('oldAgreementAppendix') as string,
            oldAgreementSent: body.get('oldAgreementSent') === 'true',
          }
        : ({
            newAgreementDateSigned: body.get('newAgreementSigned') as string,
            newAgreementDateShared: body.get('newAgreementShared') as string,
            newAgreementLinkToAgreement: body.get('newAgreementLink') as string,
            newAgreementDateSent: body.get('newAgreementDateSent') as string,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
          } as any)),
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
  if (!isLoggedIn(request)) {
    return redirect('/signin');
  }
  const [error, data] = await getAgreementData();
  if (error) {
    return json({ error }, { status: 500 });
  }
  return json(data);
}

export function shouldRevalidate({ formAction }: ShouldRevalidateFunctionArgs) {
  if (formAction === '/api/responsibles') return false;
  return true;
}

export default function Agreement() {
  const data = useLoaderData<typeof loader>();
  const [fields, setFields] = useState<Field[]>([]);
  const fetcher = useFetcher();
  const setIds = useIds((state) => state.setIds);

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
        type: 'text',
        select: true,
        defaultValue: data.typeOfAgreement,
        watchable: true,
        options: [
          { label: 'New agreement', value: 'new' },
          { label: 'Old agreement', value: 'old' },
        ],
      },
      {
        label: 'Old agreement sent',
        name: 'oldAgreementSent',
        type: 'text',
        select: true,
        defaultValue: data.oldAgreementSent,
        condition: ['typeOfAgreement', 'old'],
        options: [
          { label: 'Sent', value: 'true' },
          { label: 'Not sent', value: 'false' },
        ],
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
        type: 'link',
        defaultValue: data.oldAgreementLink || undefined,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Link to appendix',
        name: 'oldAgreementAppendix',
        type: 'link',
        defaultValue: data.oldAgreementAppendix || undefined,
        condition: ['typeOfAgreement', 'old'],
      },

      {
        label: 'Time for sending new agreement',
        name: 'newAgreementDateSent',
        type: 'date',
        defaultValue: data.newAgreementDateSent as unknown as string,
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
        type: 'link',
        defaultValue: data.newAgreementLink || undefined,
        condition: ['typeOfAgreement', 'new'],
      },
    ]);
  }, []);

  const columns = useMemo<ColumnDef<AgreementData>[]>(
    () => [
      {
        header: 'Municipality',
        id: 'companyName',
        enableHiding: false,
        accessorKey: 'companyName',
        filterFn: 'includesString',
        size: 200,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.companyId}`} prefetch="intent">
            {getValue() as string}
          </Link>
        ),
      },
      {
        header: 'In agreement',
        accessorKey: 'inAgreement',
        id: 'inAgreement',
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
        header: 'Type of agreement',
        accessorKey: 'typeOfAgreement',
        id: 'typeOfAgreement',
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
        header: 'First time any agreement',
        accessorKey: 'firstTimeAnyAgreement',
        id: 'firstTimeAnyAgreement',
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'first agreement date',
          filterByDate: true,
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },

      {
        header: 'Old agreement sent',
        accessorKey: 'oldAgreementSent',
        id: 'oldAgreementSent',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Agreement sent',
          defaultHidden: true,
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
        id: 'isOldAgreementSigned',
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
          defaultHidden: true,
        },
      },
      {
        header: 'Old agreement agreement signed date',
        accessorKey: 'oldAgreementSigned',
        id: 'oldAgreementSigned',
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Old agreement agreement signed date',
          filterByDate: true,
          defaultHidden: true,
        },
        enableSorting: false,
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Old agreement agreement shared with EPA',
        accessorKey: 'isOldAgreementShared',
        id: 'isOldAgreementShared',
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
          filterOptionsLabel: 'Old agreement shared with EPA',
          defaultHidden: true,
        },
      },
      {
        header: 'Old agreement shared date with EPA',
        accessorKey: 'oldAgreementShared',
        id: 'oldAgreementShared',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Filter Old agreement shared date with EPA',
          filterByDate: true,
          defaultHidden: true,
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'New agreement sent',
        accessorKey: 'newAgreementSent',
        id: 'newAgreementSent',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'New agreement sent',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Time for sending new agreement',
        accessorKey: 'newAgreementDateSent',
        id: 'newAgreementDateSent',
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Time for sending new agreement',
          filterByDate: true,
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'New agreement agreement signed',
        accessorKey: 'isNewAgreementSigned',
        id: 'isNewAgreementSigned',
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
        id: 'newAgreementSigned',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'New agreement agreement signed date',
          filterByDate: true,
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'New agreement agreement shared with EPA',
        accessorKey: 'isNewAgreementShared',
        id: 'isNewAgreementShared',
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
          filterOptionsLabel: 'New agreement shared with EPA',
        },
      },
      {
        header: 'New agreement shared date with EPA',
        accessorKey: 'newAgreementShared',
        id: 'newAgreementShared',
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'New agreement shared date with EPA',
          filterByDate: true,
        },
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
      },
      {
        header: 'Links',
        accessorKey: 'oldAgreementLink',
        id: 'links',
        enableSorting: false,
        enableColumnFilter: false,
        cell: ({ row }) =>
          row.original.newAgreementLink ? (
            <Tooltip title="Avtal om den kommunala insamlingen av fimpar">
              <IconButton component="a" href={row.original.newAgreementLink} target="_blank" rel="noreferrer">
                <LinkIcon />
              </IconButton>
            </Tooltip>
          ) : row.original.oldAgreementLink ? (
            <Stack direction="row" spacing={1}>
              <Tooltip title="Avtal om den kommunala insamlingen av fimpar">
                <IconButton component="a" href={row.original.oldAgreementLink} target="_blank" rel="noreferrer">
                  <LinkIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Bilaga 8.1. Ersättningsmodell ">
                <IconButton component="a" href={row.original.oldAgreementAppendix} target="_blank" rel="noreferrer">
                  <LinkAddIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          ) : null,
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
              name={`${row.original.companyName as string} municipality`}
              id={row.original.id as string}
              isEditable
              onEdit={() => setEditableData(row.original)}
              link={`/communes/${row.original.companyId}`}
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
      additionalTitleElement={<SendEmail />}
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        onFilter={(rows) => setIds(rows.map((row) => row.original.companyId))}
        data={data as AgreementData[]}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>In agreement: {rows.filter((row) => row.original.inAgreement).length}</Typography>
            <Typography>Old agreement sent: {rows.filter((row) => row.original.oldAgreementSent).length}</Typography>
            <Typography>
              Old agreement signed:{' '}
              {rows.filter((row) => row.original.oldAgreementSigned && !row.original.newAgreementSigned).length}
            </Typography>
            <Typography>
              Old agreement shared with EPA: {rows.filter((row) => row.original.oldAgreementShared).length}
            </Typography>
            <Typography>New agreement sent: {rows.filter((row) => row.original.newAgreementSent).length}</Typography>
            <Typography>
              New agreement signed: {rows.filter((row) => row.original.newAgreementSigned).length}
            </Typography>
            <Typography>
              New agreement shared with EPA: {rows.filter((row) => row.original.newAgreementShared).length}
            </Typography>
          </>
        )}
      />
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
