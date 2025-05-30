import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import LinkIcon from '@mui/icons-material/Link';
import { IconButton, Link, Tooltip, Typography } from '@mui/material';
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
import {
  editInitialConsultationRecord,
  getInitialConsultationData,
  type InitialConsultation as IInitialConsultation,
} from '~/utils/server/repositories/initialConsultation.server';
import { useIds } from '~/utils/store';

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Initial consultation stage' },
    { name: 'description', content: 'Initial consultation stage with all the municipalities' },
  ];
};

export async function action({ request }: ActionFunctionArgs) {
  if (!isLoggedIn(request)) {
    return redirect('/signin');
  }
  if (request.method === 'PATCH') {
    const body = await request.formData();
    const id = body.get('id');
    if (!id) {
      return json({ message: 'Id is required', severity: 'error', timeStamp: new Date() }, { status: 400 });
    }
    const [error] = await editInitialConsultationRecord({
      id: id as string,
      // @ts-expect-error - we know that these values are strings
      dateShared: body.get('dateShared') as string,
      // @ts-expect-error - we know that these values are strings
      dateSigned: body.get('dateSigned') as string,
      // @ts-expect-error - we know that these values are strings
      documentDateSent: body.get('documentDateSent') as string,
      link: body.get('link') as string,
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
  const [error, data] = await getInitialConsultationData();
  if (error) {
    return json({ error }, { status: 500 });
  }
  return json(data);
}

export function shouldRevalidate({ formAction }: ShouldRevalidateFunctionArgs) {
  if (formAction === '/api/responsibles') return false;
  return true;
}

export default function InitialConsultation() {
  const data = useLoaderData<typeof loader>();
  const [fields, setFields] = useState<Field[]>([]);
  const fetcher = useFetcher();
  const setIds = useIds((state) => state.setIds);

  const setEditableData = useCallback((data: IInitialConsultation) => {
    setFields([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Time for sending initial consultation',
        name: 'documentDateSent',
        type: 'date',
        defaultValue: data.dateSent as unknown as string,
      },
      {
        label: 'Date signed',
        name: 'dateSigned',
        type: 'date',
        defaultValue: data.dateSigned as unknown as string,
      },

      {
        label: 'Date shared with EPA',
        name: 'dateShared',
        type: 'date',
        defaultValue: data.dateShared as unknown as string,
      },
      {
        label: 'Link to signed document',
        name: 'link',
        type: 'link',
        defaultValue: data.link,
      },
    ]);
  }, []);

  const columns = useMemo<ColumnDef<IInitialConsultation>[]>(
    () => [
      {
        header: 'Municipality',
        accessorKey: 'companyName',
        id: 'companyName',
        enableHiding: false,
        filterFn: 'includesString',
        size: 200,
        cell: ({ getValue, row }) => (
          <Link component={RLink} to={`/municipalities/${row.original.companyId}`} prefetch="intent">
            {getValue() as string}
          </Link>
        ),
      },
      {
        header: 'Initial consultation document sent',
        accessorKey: 'documentSent',
        filterFn: 'boolean',
        id: 'documentSent',
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
        header: 'Time for sending initial consultation',
        accessorKey: 'dateSent',
        id: 'dateSent',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        enableSorting: false,
        size: 150,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Time for sending initial consultation document',
          filterByDate: true,
        },
      },
      {
        header: 'Initial consultation document signed',
        accessorKey: 'isSigned',
        id: 'isSigned',
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
          filterOptionsLabel: 'Document signed',
        },
      },
      {
        header: 'Time for signing initial consultation document',
        accessorKey: 'dateSigned',
        id: 'dateSigned',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        enableSorting: false,
        size: 150,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Filter Time for signing initial consultation document',
          filterByDate: true,
        },
      },
      {
        header: 'Shared with EPA',
        accessorKey: 'isShared',
        id: 'isShared',
        filterFn: 'boolean',
        meta: {
          filterOptions: [
            { label: 'Yes', value: true },
            { label: 'No', value: false },
          ],
          filterOptionsLabel: 'Shared with EPA',
        },
        cell: ({ getValue }) =>
          getValue() ? (
            <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
          ) : (
            <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
          ),
      },
      {
        header: 'Date shared with EPA',
        accessorKey: 'dateShared',
        id: 'dateShared',
        cell: ({ getValue }) => (getValue() ? formatDate(getValue() as string) : ''),
        enableSorting: false,
        filterFn: 'dateRange',
        meta: {
          filterOptionsLabel: 'Filter Date shared with EPA',
          filterByDate: true,
        },
        size: 150,
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
              link={`/municipalities/${row.original.companyId}`}
              additionalElement={
                row.original.link ? (
                  <Tooltip title="Bilaga 7.2. Formulär för inledande samråd">
                    <IconButton component="a" href={row.original.link} target="_blank" rel="noreferrer">
                      <LinkIcon />
                    </IconButton>
                  </Tooltip>
                ) : null
              }
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
      title="Initial consultation"
      additionalTitleElement={<SendEmail />}
      actionData={fetcher.data as { message: string; severity: string } | undefined}
    >
      <PaginatedTable
        onFilter={(rows) => setIds(rows.map((row) => row.original.companyId))}
        data={data as IInitialConsultation[]}
        columns={columns}
        additionalHeader={(rows) => (
          <>
            <Typography>Initial consultation sent: {rows.filter((row) => row.original.documentSent).length}</Typography>
            <Typography>
              Initial consultation document signed: {rows.filter((row) => row.original.isSigned).length}
            </Typography>
            <Typography>
              Initial consultation document shared: {rows.filter((row) => row.original.isShared).length}
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
            title={`Edit initial consultation for ${(data as IInitialConsultation[])?.find((d) => d.id === fields[0]?.defaultValue)?.companyName}`}
            fetcher={fetcher}
            url="/initial-consultation"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
