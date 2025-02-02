/* eslint-disable @typescript-eslint/no-explicit-any */
import { Box, Card, CardContent, Chip, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { AgreementCard } from '~/components/municipality/AgreementCard';
import { InitialConsultationCard } from '~/components/municipality/InitialConsultationCard';
import { LogsTable } from '~/components/municipality/LogsTable';
import { RecurringConsultation } from '~/components/municipality/RecurringConsultationCard';
import { ResponsiblesTable } from '~/components/municipality/ResponsiblesTable';
import { PageContainer } from '~/components/shared/PageContainer';
import { auth } from '~/utils/server/auth.server';
import { getAgreementForMunicipality } from '~/utils/server/repositories/agreement.server';
import { getInitialConsultationForMunicipality } from '~/utils/server/repositories/initialConsultation.server';
import { getMunicipalityData, MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { getLogsForCompany, LogForCompany } from '~/utils/server/repositories/notes-log.server';
import {
  getRecurringConsultationForCompanyAndYears,
  RecurringConsultationPerMunicipality,
} from '~/utils/server/repositories/recurringConsultation.server';
import { getResponsiblesForMunicipality, ResponsibleData } from '~/utils/server/repositories/responsibles.server';
import { getAllStatuses, Status } from '~/utils/server/repositories/status.server';

interface LoaderResponse {
  logs: LogForCompany[];
  municipality: MunicipalityData;
  statuses: Status[];
  responsibles: ResponsibleData[];
  initialConsultation: {
    id: string;
    documentSent: boolean;
    isSigned: boolean;
    dateSigned: Date | null;
    isShared: boolean;
    dateShared: Date | null;
    link: string | null;
  };
  agreement: {
    id: string;
    oldAgreementLink: string | null;
    oldAgreementDateSigned: Date | null;
    oldAgreementShared: boolean;
    oldAgreementDateShared: Date | null;
    newAgreementLink: string | null;
    newAgreementDateSigned: Date | null;
    newAgreementShared: boolean;
    newAgreementDateShared: Date | null;
  };
  recurringConsultation: {
    data: RecurringConsultationPerMunicipality[];
    years: number[];
  };
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const id = params.municipalityId as string;
  const [logsResp, statuses, municipalityResp, responsiblesResp, initialConsultationResp, agreementResp] =
    await Promise.all([
      getLogsForCompany(id),
      getAllStatuses(),
      getMunicipalityData(id),
      getResponsiblesForMunicipality(id),
      getInitialConsultationForMunicipality(id),
      getAgreementForMunicipality(id),
    ]);

  if (
    logsResp[0] ||
    statuses[0] ||
    municipalityResp[0] ||
    responsiblesResp[0] ||
    initialConsultationResp[0] ||
    agreementResp[0]
  ) {
    return json({ message: 'Could not fetch data for company', severity: 'error' }, { status: 500 });
  }

  // Fetch recurring consultation data for all years in one query
  const [recurringConsultationError, recurringConsultationData] = await getRecurringConsultationForCompanyAndYears(
    id,
    municipalityResp?.[1]?.consultations as number[],
  );

  if (recurringConsultationError) {
    return json({ message: 'Could not fetch recurring consultation data', severity: 'error' }, { status: 500 });
  }

  return json({
    message: {
      logs: logsResp[1],
      municipality: municipalityResp[1],
      statuses: statuses[1],
      responsibles: responsiblesResp[1],
      initialConsultation: initialConsultationResp[1],
      agreement: agreementResp[1],
      recurringConsultation: {
        data: recurringConsultationData,
        years: municipalityResp?.[1]?.consultations as number[],
      },
    },
    severity: 'success',
  });
}

export default function Municipality() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const municipalityData = data.message as unknown as LoaderResponse;

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
          {municipalityData.municipality.name} ({municipalityData.municipality.code}){' '}
          <Chip color="primary" label={municipalityData.municipality.statusName} />
          <Box component="span" sx={{ fontSize: '0.75em', fontWeight: 'normal' }}>
            General email {municipalityData.municipality.email}
          </Box>
        </Typography>
      }
      additionalTitleElement={null}
      sx={{ overflow: 'auto', maxHeight: 'none', minHeight: 'none' }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        <Card>
          <CardContent>
            <ResponsiblesTable data={municipalityData.responsibles} companyId={municipalityData.municipality.id} />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <LogsTable data={municipalityData.logs} companyId={municipalityData.municipality.id} fetcher={fetcher} />
          </CardContent>
        </Card>

        <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
          <InitialConsultationCard data={municipalityData.initialConsultation} fetcher={fetcher} />

          <AgreementCard data={municipalityData.agreement} fetcher={fetcher} />
        </Box>

        <RecurringConsultation
          years={municipalityData.recurringConsultation.years}
          data={municipalityData.recurringConsultation.data}
          fetcher={fetcher}
        />
      </Box>
    </PageContainer>
  );
}
