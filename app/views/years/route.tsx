import Edit from '@mui/icons-material/Edit';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs, MetaFunction } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { PageContainer } from '~/components/shared/PageContainer';
import { useEditFields } from '~/hooks/editFields';
import { isLoggedIn } from '~/utils/server/auth.server';
import { FullYearData, getYearsData, updateYear } from '~/utils/server/repositories/years.server';

export const meta: MetaFunction = () => {
  return [{ title: 'CRM System - Years' }];
};

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  const [error, years] = await getYearsData();
  if (error) {
    return json({ message: 'Could not fetch years', severity: 'error', timeStamp: Date.now() }, { status: 500 });
  }
  return json({ years });
}

export async function action({ request }: ActionFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const id = formData.get('name') as string;
    const changeFactor = formData.get('changeFactor') as string;
    const changeFactorLitter = formData.get('changeFactorLitter') as string;
    const adminFee = formData.get('adminFee') as string;
    const sekAdmin = formData.get('sekAdmin') as string;
    const addition_1 = formData.get('addition_1') as string;
    const addition_2 = formData.get('addition_2') as string;
    const addition_3 = formData.get('addition_3') as string;

    if (
      !id ||
      !changeFactor ||
      !changeFactorLitter ||
      !adminFee ||
      !sekAdmin ||
      !addition_1 ||
      !addition_2 ||
      !addition_3
    ) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await updateYear({
      name: parseInt(id, 10),
      changeFactor: parseFloat(changeFactor),
      changeFactorLitter: parseFloat(changeFactorLitter),
      adminFee: parseInt(adminFee),
      sekAdmin: parseFloat(sekAdmin),
      addition_1: parseFloat(addition_1),
      addition_2: parseFloat(addition_2),
      addition_3: parseFloat(addition_3),
    });
    if (error) {
      return json({ message: 'Cold not update the year', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Year updated successfully.', severity: 'success', timeStamp: Date.now() });
  }

  return json({ message: '', severity: 'error', timeStamp: Date.now() }, { status: 405 });
}

export default function YearsPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const setEditableFields = useCallback((data: FullYearData) => {
    setEditableData([
      {
        label: 'name',
        name: 'name',
        type: 'number',
        defaultValue: data.name,
        hidden: true,
      },
      {
        label: 'Change factor',
        name: 'changeFactor',
        type: 'number',
        inputProps: { step: '0.00000000000001' },
        defaultValue: data.changeFactor as number,
      },
      {
        label: 'Change factor litter (old agreement)',
        name: 'changeFactorLitter',
        type: 'number',
        inputProps: { step: '0.00000000000001' },
        defaultValue: data.changeFactor as number,
      },
      {
        label: 'SEK admin',
        name: 'sekAdmin',
        type: 'number',
        inputProps: { step: '0.000000000000001' },
        defaultValue: data.sekAdmin as number,
      },
      {
        label: 'Admin/kommun',
        name: 'adminFee',
        type: 'number',
        defaultValue: data.adminFee as number,
      },
      {
        label: 'Tillägg 1',
        name: 'addition_1',
        type: 'number',
        inputProps: { step: '0.00001' },
        defaultValue: data.addition_1 as number,
      },
      {
        label: 'Tillägg 2',
        name: 'addition_2',
        type: 'number',
        inputProps: { step: '0.00001' },
        defaultValue: data.addition_2 as number,
      },
      {
        label: 'Tillägg 3',
        name: 'addition_3',
        type: 'number',
        inputProps: { step: '0.00001' },
        defaultValue: data.addition_3 as number,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PageContainer actionData={fetcher.data} title="Years" additionalTitleElement={null}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            md: 'repeat(3, 1fr)',
            xl: 'repeat(4, 1fr)',
            '2k': 'repeat(5, 1fr)',
          },
          gap: 2,
        }}
      >
        {(data as { years: FullYearData[] }).years.map((year) => (
          <Stack
            key={year.name}
            sx={{
              boxShadow: (theme) => theme.shadows[15],
              border: '1px solid',
              borderColor: (theme) => theme.palette.grey[400],
              borderRadius: 1,
              padding: 1.5,
              backgroundColor: (theme) => theme.palette.background.paper,
            }}
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            flexWrap="wrap"
            gap={1.5}
          >
            <Typography sx={{ fontWeight: 'bold', flex: '0 0 80%', fontSize: '1.5rem', pr: 1.5 }}>
              {year.name}
            </Typography>
            <IconButton size="small" aria-label={`Edit ${year.name}`} onClick={() => setEditableFields(year)}>
              <Edit />
            </IconButton>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Change factor:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6, maximumSignificantDigits: 14 }).format(
                year.changeFactor as number,
              )}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Change factor litter (old agreement):
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6, maximumFractionDigits: 14 }).format(
                year.changeFactorLitter as number,
              )}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                SEK admin:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 3, maximumFractionDigits: 15 }).format(
                year.sekAdmin as number,
              )}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Admin/kommun:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE').format(year.adminFee as number)}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Tillägg 1:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(
                year.addition_1 as number,
              )}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Tillägg 2:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(
                year.addition_2 as number,
              )}
            </Typography>
            <Typography>
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                Tillägg 3:
              </Box>{' '}
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 0, maximumFractionDigits: 6 }).format(
                year.addition_3 as number,
              )}
            </Typography>
          </Stack>
        ))}
      </Box>

      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit ${(data as { years: FullYearData[] }).years?.find((d) => d.name === fields[0]?.defaultValue)?.name} year`}
            fetcher={fetcher}
            url="/years"
          />
        )}
      </ClientOnly>
    </PageContainer>
  );
}
