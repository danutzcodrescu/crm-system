import { Box, Card, CardContent } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';

import { AgreementCard } from '~/components/municipality/AgreementCard';
import { CompensationCard } from '~/components/municipality/CompensationCard';
import { EmailsCard } from '~/components/municipality/EmailsCard';
import { GeneralInformationCard } from '~/components/municipality/GeneralInformationCard';
import { InitialConsultationCard } from '~/components/municipality/InitialConsultationCard';
import { InvoicingCard } from '~/components/municipality/InvoicingCard';
import { LogsTable } from '~/components/municipality/LogsTable';
import { RecurringConsultation } from '~/components/municipality/RecurringConsultationCard';
import { ReportingCard } from '~/components/municipality/ReportingCard';
import { ResponsiblesTable } from '~/components/municipality/ResponsiblesTable';
import { MunicipalityTitle } from '~/components/municipality/Title';
import { PageContainer } from '~/components/shared/PageContainer';
import { auth } from '~/utils/server/auth.server';
import { getAgreementForMunicipality, MunicipalityAgreementData } from '~/utils/server/repositories/agreement.server';
import { CompensationDataPerCompany, getCompensationForCompany } from '~/utils/server/repositories/compensation.server';
import {
  GeneralInformationPerMunicipality,
  getGeneralInformationForCompany,
} from '~/utils/server/repositories/generalInformation.server';
import { getInitialConsultationForMunicipality } from '~/utils/server/repositories/initialConsultation.server';
import { getInvoicingForCompany, InvoicingData } from '~/utils/server/repositories/invoicing.server';
import { getMunicipalityData, MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { getLogsForCompany, LogForCompany } from '~/utils/server/repositories/notes-log.server';
import {
  getRecurringConsultationForCompanyAndYears,
  RecurringConsultationPerMunicipality,
} from '~/utils/server/repositories/recurringConsultation.server';
import { getReportingForCompany, ReportingData } from '~/utils/server/repositories/reporting.server';
import { getResponsiblesForMunicipality, ResponsibleData } from '~/utils/server/repositories/responsibles.server';
import { getAllUsers, User } from '~/utils/server/repositories/users.server';
import { gmail } from '~/utils/server/services/gmail.server';

interface LoaderResponse {
  logs: LogForCompany[];
  municipality: MunicipalityData;
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
  agreement: MunicipalityAgreementData;
  recurringConsultation: {
    data: RecurringConsultationPerMunicipality[];
    years: number[];
  };
  reporting: ReportingData[];
  generalInformation: GeneralInformationPerMunicipality[];
  compensation: CompensationDataPerCompany[];
  invoicing: InvoicingData[];
  users: User[];
  emailAddress: string;
}

export async function loader({ request, params }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');
  if (!gmail.isTokenSet()) {
    await gmail.getRedirectUrlIfThereIsNoToken(request);
  }

  const id = params.municipalityId as string;
  const currentYear = new Date().getFullYear();
  const [
    logsResp,
    municipalityResp,
    responsiblesResp,
    initialConsultationResp,
    agreementResp,
    reportingResp,
    generalInformationResp,
    compensationResp,
    invoicingResp,
    usersResp,
    email,
  ] = await Promise.all([
    getLogsForCompany(id),
    getMunicipalityData(id),
    getResponsiblesForMunicipality(id),
    getInitialConsultationForMunicipality(id),
    getAgreementForMunicipality(id),
    getReportingForCompany(id, currentYear),
    getGeneralInformationForCompany(id, currentYear),
    getCompensationForCompany(id, currentYear),
    getInvoicingForCompany(id, currentYear),
    getAllUsers(),
    gmail.getEmail(),
  ]);

  if (
    logsResp[0] ||
    municipalityResp[0] ||
    responsiblesResp[0] ||
    initialConsultationResp[0] ||
    agreementResp[0] ||
    reportingResp[0] ||
    generalInformationResp[0] ||
    compensationResp[0] ||
    invoicingResp[0] ||
    usersResp[0]
  ) {
    return json({ message: 'Could not fetch data for company', severity: 'error' }, { status: 500 });
  }

  setImmediate(() => gmail.clearRefreshToken());

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
      users: usersResp[1],
      logs: logsResp[1],
      municipality: municipalityResp[1],
      responsibles: responsiblesResp[1],
      initialConsultation: initialConsultationResp[1],
      agreement: agreementResp[1],
      recurringConsultation: {
        data: recurringConsultationData,
        years: municipalityResp?.[1]?.consultations as number[],
      },
      reporting: reportingResp[1],
      generalInformation: generalInformationResp[1],
      compensation: compensationResp[1],
      invoicing: invoicingResp[1],
      emailAddress: email?.[1],
    },
    severity: 'success',
  });
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
  return [{ title: `CRM System - ${(data?.message as unknown as LoaderResponse)?.municipality?.name} Municipality` }];
};

export default function Municipality() {
  const data = useLoaderData<typeof loader>();
  const fetcher = useFetcher();

  const municipalityData = data.message as unknown as LoaderResponse;

  return (
    <PageContainer
      actionData={fetcher.data as { message: string; severity: string } | undefined}
      title={
        <MunicipalityTitle
          municipality={municipalityData.municipality}
          fetcher={fetcher}
          users={municipalityData.users}
        />
      }
      additionalTitleElement={null}
      sx={{ overflow: 'auto', maxHeight: 'none', minHeight: 'none' }}
    >
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { lg: '1fr 1fr', xs: '1fr', '2k': 'repeat(3, 1fr)', '2k-wide': 'repeat(4, 1fr)' },
          gap: 3,
        }}
      >
        <Card>
          <CardContent>
            <ResponsiblesTable
              data={municipalityData.responsibles}
              companyId={municipalityData.municipality.id}
              fetcher={fetcher}
              infoVerified={municipalityData.municipality.infoVerified as unknown as string}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <LogsTable data={municipalityData.logs} companyId={municipalityData.municipality.id} fetcher={fetcher} />
          </CardContent>
        </Card>

        <InitialConsultationCard data={municipalityData.initialConsultation} fetcher={fetcher} />

        <AgreementCard data={municipalityData.agreement} fetcher={fetcher} />
        <RecurringConsultation
          years={municipalityData.recurringConsultation.years}
          data={municipalityData.recurringConsultation.data}
          fetcher={fetcher}
        />

        <ReportingCard data={municipalityData.reporting} fetcher={fetcher} />

        <CompensationCard data={municipalityData.compensation} />

        <InvoicingCard data={municipalityData.invoicing} fetcher={fetcher} />

        <GeneralInformationCard data={municipalityData.generalInformation} fetcher={fetcher} />
        {municipalityData.emailAddress ? <EmailsCard email={municipalityData.emailAddress} /> : null}
      </Box>
    </PageContainer>
  );
}
