/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback, useState } from 'react';

import { LogsTable } from '~/components/municipality/LogsTable';
import { ResponsiblesTable } from '~/components/municipality/ResponsiblesTable';
import { PageContainer } from '~/components/shared/PageContainer';
import { auth } from '~/utils/server/auth.server';
import { getMunicipalityData, MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { getLogsForCompany, LogForCompany } from '~/utils/server/repositories/notes-log.server';
import { getResponsiblesForMunicipality, ResponsibleData } from '~/utils/server/repositories/responsibles.server';
import { getAllStatuses, Status } from '~/utils/server/repositories/status.server';
type TabValues = 'logs' | 'employees' | 'reminders' | 'meetings';

interface LoaderResponse {
  logs: LogForCompany[];
  municipality: MunicipalityData;
  statuses: Status[];
  responsibles: ResponsibleData[];
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const id = params.municipalityId as string;
  const [logsResp, statuses, municipalityResp, responsiblesResp] = await Promise.all([
    getLogsForCompany(id),
    getAllStatuses(),
    getMunicipalityData(id),
    getResponsiblesForMunicipality(id),
  ]);
  if (logsResp[0] || statuses[0] || municipalityResp[0] || responsiblesResp[0]) {
    return json({ message: 'Could not fetch data for company', severity: 'error' }, { status: 500 });
  }
  return json({
    message: {
      logs: logsResp[1],
      municipality: municipalityResp[1],
      statuses: statuses[1],
      responsibles: responsiblesResp[1],
    },
    severity: 'success',
  });
}

export default function Municipality() {
  const data = useLoaderData<typeof loader>();
  console.log(data);
  const [tabValue, setTabValue] = useState<TabValues>('logs');
  const fetcher = useFetcher();

  const handleChange = useCallback((_: React.SyntheticEvent, newValue: TabValues) => {
    setTabValue(newValue);
  }, []);

  return (
    <PageContainer
      actionData={fetcher.data as { message: string; severity: string } | undefined}
      title={
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}
        >
          {(data.message as unknown as LoaderResponse).municipality.name} (
          {(data.message as unknown as LoaderResponse).municipality.code}){' '}
          <Chip color="primary" label={(data.message as unknown as LoaderResponse).municipality.statusName} />
          <Box component="span" sx={{ fontSize: '0.75em', fontWeight: 'normal' }}>
            General email {(data.message as unknown as LoaderResponse).municipality.email}
          </Box>
        </Typography>
      }
      additionalTitleElement={
        // <Tooltip title={`Edit commune ${(data.message as any).company.name}`}>
        //   <IconButton onClick={() => setEditingMode(true)} aria-label="Edit commune">
        //     <Edit />
        //   </IconButton>
        // </Tooltip>
        null
      }
    >
      <Box sx={{ display: 'grid', gap: 3, gridTemplateColumns: 'repeat(2, 1fr)' }}>
        <Card>
          <CardContent>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 'bold' }} gutterBottom>
              Responsibles
            </Typography>
            <ResponsiblesTable
              data={(data.message as unknown as LoaderResponse).responsibles}
              companyId={(data.message as unknown as LoaderResponse).municipality.id}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <LogsTable
              data={(data.message as unknown as LoaderResponse).logs}
              companyId={(data.message as unknown as LoaderResponse).municipality.id}
              fetcher={fetcher}
            />
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
