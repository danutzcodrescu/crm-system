import { Box } from '@mui/material';
import { ActionFunctionArgs, json, LoaderFunctionArgs } from '@remix-run/node';
import { redirect, useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback } from 'react';

import { PageContainer } from '~/components/shared/PageContainer';
import { AddYear } from '~/components/year/AddYear';
import { YearItem } from '~/components/year/YearItem';
import { auth } from '~/utils/server/auth.server';
import { createYear, deleteYear, getAllYears, updateYear } from '~/utils/server/repositories/years.server';

export async function loader({ request }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const years = await getAllYears();
  return json({ years });
}

export async function action({ request }: ActionFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  if (request.method === 'DELETE') {
    const formData = await request.formData();
    const id = formData.get('name') as string;
    if (!id) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await deleteYear(parseFloat(id));
    if (error) {
      return json({ message: 'Cold not delete the year', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Status deleted successfully.', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'PATCH') {
    const formData = await request.formData();
    const id = formData.get('name') as string;
    const inflationRate = formData.get('inflationRate') as string;

    if (!id || !inflationRate) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await updateYear(parseInt(id, 10), parseFloat(inflationRate));
    if (error) {
      return json({ message: 'Could not update the year', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }
    return json({ message: 'Year updated successfully.', severity: 'success', timeStamp: Date.now() });
  }

  if (request.method === 'POST') {
    const formData = await request.formData();
    const name = formData.get('name') as string;
    const inflationRate = formData.get('inflationRate') as string;
    if (!name || !inflationRate) {
      return json({ message: 'Missing parameters', severity: 'error', timeStamp: Date.now() }, { status: 400 });
    }

    const error = await createYear(parseInt(name, 10), parseFloat(inflationRate));
    if (error) {
      return json({ message: 'Could not create year', severity: 'error', timeStamp: Date.now() }, { status: 500 });
    }

    return json({ message: 'Year created successfully.', severity: 'success', timeStamp: Date.now() });
  }
  return json({ message: '', severity: 'error', timeStamp: Date.now() }, { status: 405 });
}

export default function YearsPage() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher<typeof action>();

  const deleteYear = useCallback((name: number) => {
    fetcher.submit({ name: name.toString() }, { method: 'DELETE', action: '/years', relative: 'path' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <PageContainer actionData={fetcher.data} title="Years" additionalTitleElement={<AddYear fetcher={fetcher} />}>
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 2 }}>
        {data.years.map((year) => (
          <YearItem key={year.name} name={year.name} inflationRate={year.inflationRate} deleteYear={deleteYear} />
        ))}
      </Box>
    </PageContainer>
  );
}
