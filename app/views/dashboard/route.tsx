import { Box, Card, CardContent, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, MetaFunction, redirect } from '@remix-run/node';
import { useLoaderData } from '@remix-run/react';

import { PageContainer } from '~/components/shared/PageContainer';
import { auth } from '~/utils/server/auth.server';
import { getInAgreementCount } from '~/utils/server/repositories/agreement.server';
import { getSignedInitialConsultation } from '~/utils/server/repositories/initialConsultation.server';
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
}

export async function loader({ request }: LoaderFunctionArgs) {
  if (!auth.isLoggedIn(request)) {
    return redirect('/signin');
  }
  const [initialConsultation, agreement, reporting] = await Promise.all([
    getSignedInitialConsultation(),
    getInAgreementCount(),
    getGroupedReportingPerYear(2022, new Date().getFullYear()),
  ]);
  if (initialConsultation[0] || agreement[0] || reporting[0]) {
    return json({ error: initialConsultation[0] || agreement[0] }, { status: 500 });
  }
  return json({
    initialConsultation: initialConsultation[1]?.[0].initialConsultationSigned,
    agreement: {
      old: agreement[1]?.[0].inOldAgreement,
      new: agreement[1]?.[0].inNewAgreement,
    },
    reporting: reporting[1],
  });
}
export default function Dashboard() {
  const data = useLoaderData<LoaderResponse>();
  if (!data) return null;
  return (
    <PageContainer title="Dashboard" additionalTitleElement={null}>
      <Box sx={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
        <Card>
          <CardContent>
            <Typography gutterBottom sx={{ color: 'text.secondary' }}>
              Initial consultation signed:{' '}
              <Box component="span" fontWeight="bold">
                {data.initialConsultation}
              </Box>
            </Typography>
          </CardContent>
        </Card>
        <Card sx={{ minWidth: 300 }}>
          <CardContent>
            <Typography gutterBottom sx={{ color: 'text.secondary' }}>
              Agreement signed:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.old + data.agreement.new}
              </Box>
            </Typography>
            <Typography>
              Old agreement signed:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.old}
              </Box>
            </Typography>
            <Typography>
              New agreement signed:{' '}
              <Box component="span" fontWeight="bold">
                {data.agreement.new}
              </Box>
            </Typography>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'grid',
                gridTemplateColumns: '230px repeat(3, 80px)',
                gap: 1.5,
                '& > p:first-of-type': {
                  gridColumnStart: 2,
                },
              }}
            >
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                  {report.year}
                </Typography>
              ))}
              <Typography>Have reported</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center' }}>
                  {report.haveReported}
                </Typography>
              ))}
              <Typography>Have provided motivation</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center' }}>
                  {report.haveMotivated}
                </Typography>
              ))}
              <Typography>Total reported quantity (KG)</Typography>
              {data.reporting.map((report) => (
                <Typography key={report.year} sx={{ textAlign: 'center' }}>
                  {Intl.NumberFormat('sv-SE').format(parseFloat(report.cigaretteButts || '0'))}
                </Typography>
              ))}
            </Box>
          </CardContent>
        </Card>
      </Box>
    </PageContainer>
  );
}
