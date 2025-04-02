import Alarm from '@mui/icons-material/Alarm';
import { Box, Card, CardContent, Link, Stack, Tooltip, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { Link as RLink, useLoaderData } from '@remix-run/react';
import { isAfter } from 'date-fns';
import { Fragment } from 'react/jsx-runtime';

import { PageContainer } from '~/components/shared/PageContainer';
import { formatDate } from '~/utils/client/dates';
import { auth } from '~/utils/server/auth.server';
import { getInAgreementCount } from '~/utils/server/repositories/agreement.server';
import { ConsultationPerYear, getCompaniesWithConsultationInYear } from '~/utils/server/repositories/companies.server';
import {
  AggregatedCompensationPerYear,
  getAggregatedCompensationPerYear,
} from '~/utils/server/repositories/compensation.server';
import { getSignedInitialConsultation } from '~/utils/server/repositories/initialConsultation.server';
import { getInvoicingAggregatedPerYear, InvoicingAggregated } from '~/utils/server/repositories/invoicing.server';
import { getUpcomingMeetings, UpcomingMeeting } from '~/utils/server/repositories/recurringConsultation.server';
import { getAllReminders, ReminderData } from '~/utils/server/repositories/reminders.server';
import { getGroupedReportingPerYear, GroupedReportingPerYear } from '~/utils/server/repositories/reporting.server';

export const meta: MetaFunction = () => {
  return [{ title: 'CRM System - Dashboard' }, { name: 'description', content: 'Dashboard for all municipality data' }];
};

interface LoaderResponse {
  initialConsultation: number;
  agreement: {
    old: number;
    new: number;
  };
  reporting: GroupedReportingPerYear[];
  compensation: AggregatedCompensationPerYear[];
  invoicing: InvoicingAggregated[];
  recurringConsultations: ConsultationPerYear[];
  upcomingMeetings: UpcomingMeeting[];
  reminders: ReminderData[];
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const currentYear = new Date().getFullYear();
  const [
    initialConsultation,
    agreement,
    reporting,
    compensation,
    invoicing,
    recurringConsultations,
    upcomingMeetings,
    reminders,
  ] = await Promise.all([
    getSignedInitialConsultation(),
    getInAgreementCount(),
    getGroupedReportingPerYear(2022, currentYear),
    getAggregatedCompensationPerYear(2023, currentYear),
    getInvoicingAggregatedPerYear(2023, currentYear),
    getCompaniesWithConsultationInYear(currentYear),
    getUpcomingMeetings(currentYear),
    getAllReminders(),
  ]);

  if (
    initialConsultation[0] ||
    agreement[0] ||
    reporting[0] ||
    compensation[0] ||
    invoicing[0] ||
    recurringConsultations[0] ||
    upcomingMeetings[0] ||
    reminders[0]
  ) {
    return json(
      {
        error:
          initialConsultation[0] ||
          agreement[0] ||
          reporting[0] ||
          compensation[0] ||
          invoicing[0] ||
          recurringConsultations[0] ||
          upcomingMeetings[0],
        reminders: reminders[0],
      },
      { status: 500 },
    );
  }

  return json({
    initialConsultation: initialConsultation[1]?.[0].initialConsultationSigned,
    agreement: {
      old: agreement[1]?.[0].inOldAgreement,
      new: agreement[1]?.[0].inNewAgreement,
    },
    reporting: reporting[1],
    compensation: compensation[1],
    invoicing: invoicing[1],
    recurringConsultations: recurringConsultations[1] || [],
    upcomingMeetings: upcomingMeetings[1] || [],
    reminders: reminders[1] || [],
  });
}

export default function Dashboard() {
  const data = useLoaderData<LoaderResponse>();
  if (!data) return null;
  return (
    <PageContainer title="Dashboard" additionalTitleElement={null} sx={{ overflow: 'auto' }}>
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', bgcolor: 'primary.dark', p: 3, borderRadius: 2, px: 0 }}>
        <Card sx={{ bgcolor: 'background.paper', flexBasis: '100%' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Reminders
            </Typography>
            {data.reminders.length === 0 ? <Typography color="text.secondary">No reminders</Typography> : null}
            {data.reminders.length > 0 ? (
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `max-content 1fr max-content 1fr`,
                  gap: 3,
                }}
              >
                {data.reminders.map((reminder) => (
                  <Fragment key={reminder.id}>
                    <Link component={RLink} to={`/municipalities/${reminder.companyId}`} prefetch="intent">
                      {reminder.companyName}
                    </Link>
                    <Stack direction="row" gap={1} alignItems="center">
                      <Alarm color={isAfter(new Date(reminder.date), new Date()) ? 'primary' : 'error'} />
                      <Tooltip title={reminder.description}>
                        <Typography variant="body2" component="span">
                          {formatDate(reminder.date)}
                        </Typography>
                      </Tooltip>
                    </Stack>
                  </Fragment>
                ))}
              </Box>
            ) : null}
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Initial Consultation
            </Typography>
            <Typography sx={{ color: 'text.primary' }}>
              Signed:{' '}
              <Box component="span" fontWeight="bold" color="text.primary">
                {data.initialConsultation}
              </Box>
            </Typography>
          </CardContent>
        </Card>

        <Card sx={{ minWidth: 300, bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
              Agreements
            </Typography>
            <Typography sx={{ color: 'text.primary', mb: 1 }}>
              Total signed:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.old + data.agreement.new}
              </Box>
            </Typography>
            <Typography sx={{ color: 'text.primary', mb: 1 }}>
              Old agreement:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.old}
              </Box>
            </Typography>
            <Typography sx={{ color: 'text.primary' }}>
              New agreement:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.new}
              </Box>
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ bgcolor: 'background.paper' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
              Reporting Statistics
            </Typography>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: `230px repeat(${Array.from({ length: new Date().getFullYear() - 2022 }).length}, 80px)`,
                gap: 1.5,
                '& > p:first-of-type': {
                  gridColumnStart: 2,
                },
              }}
            >
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center', fontWeight: 'bold', color: 'text.primary' }}>
                  {report.year}
                </Typography>
              ))}
              <Typography sx={{ color: 'text.primary' }}>Have reported</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                  {report.haveReported}
                </Typography>
              ))}
              <Typography sx={{ color: 'text.primary' }}>Have provided motivation</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                  {report.haveMotivated}
                </Typography>
              ))}
              <Typography sx={{ color: 'text.primary' }}>Total reported quantity (KG)</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                  {Intl.NumberFormat('sv-SE').format(parseFloat(report.cigaretteButts || '0'))}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
        <Stack direction="row" spacing={3} width="100%">
          <Card sx={{ flex: 1, bgcolor: 'background.paper' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                Compensation Overview
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `180px repeat(${Array.from({ length: new Date().getFullYear() - 2022 }).length}, 1fr)`,
                  gap: 1.5,
                  '& > p:first-of-type': {
                    gridColumnStart: 2,
                  },
                }}
              >
                {data.compensation.map((comp) => (
                  <Typography key={comp.year} sx={{ textAlign: 'center', fontWeight: 'bold', color: 'text.primary' }}>
                    {comp.year}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Total compensation</Typography>
                {data.compensation.map((comp) => (
                  <Typography key={comp.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    }).format(parseFloat(comp.totalCompensation as unknown as string))}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Eligible</Typography>
                {data.compensation.map((comp) => (
                  <Typography key={comp.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    }).format(parseFloat(comp.eligible as unknown as string))}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold', mb: 2 }}>
                Invoicing Status
              </Typography>
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: `180px repeat(${Array.from({ length: new Date().getFullYear() - 2022 }).length}, 1fr)`,
                  gap: 1.5,
                }}
              >
                <Typography></Typography>
                {data.invoicing.map((inv) => (
                  <Typography key={inv.year} sx={{ textAlign: 'center', fontWeight: 'bold', color: 'text.primary' }}>
                    {inv.year}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Entitled to invoice</Typography>
                {data.invoicing.map((inv) => (
                  <Typography key={inv.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {inv.entitled}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Invoice sent</Typography>
                {data.invoicing.map((inv) => (
                  <Typography key={inv.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {inv.invoiced}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Invoice paid</Typography>
                {data.invoicing.map((inv) => (
                  <Typography key={inv.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {inv.paid}
                  </Typography>
                ))}
                <Typography sx={{ color: 'text.primary' }}>Total paid</Typography>
                {data.invoicing.map((inv) => (
                  <Typography key={inv.year} sx={{ textAlign: 'center', color: 'text.primary' }}>
                    {Intl.NumberFormat('sv-SE', {
                      style: 'currency',
                      currency: 'SEK',
                    }).format(parseFloat(inv.totalPaid as unknown as string))}
                  </Typography>
                ))}
              </Box>
            </CardContent>
          </Card>
        </Stack>
        <Stack spacing={3} width="100%" direction="row">
          <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Municipalities with Recurring Consultations in {new Date().getFullYear()}
              </Typography>
              {data.recurringConsultations.length === 0 ? (
                <Typography color="text.secondary">
                  No municipalities found with recurring consultations in {new Date().getFullYear()}
                </Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 3fr)' }}>
                  {data.recurringConsultations.map((company) => (
                    <Typography key={company.id}>
                      <Link component={RLink} to={`/municipalities/${company.id}`} prefetch="intent">
                        {company.name}
                      </Link>
                      {company.meetingDate ? ` - ${formatDate(company.meetingDate)}` : ''}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
          <Card sx={{ bgcolor: 'background.paper', flex: 1 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold' }}>
                Upcoming Meetings
              </Typography>
              {data.upcomingMeetings.length === 0 ? (
                <Typography color="text.secondary">No upcoming meetings scheduled</Typography>
              ) : (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(5, 3fr)' }}>
                  {data.upcomingMeetings.map((meeting, index) => (
                    <Typography key={index}>
                      <Link component={RLink} to={`/municipalities/${meeting.companyId}`} prefetch="intent">
                        {meeting.companyName}
                      </Link>
                      &nbsp;- {formatDate(meeting.meetingDate)}
                    </Typography>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </Stack>
      </Box>
    </PageContainer>
  );
}
