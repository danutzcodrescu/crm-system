import CheckBox from '@mui/icons-material/CheckBox';
import List from '@mui/icons-material/List';
import { Box, Card, CardContent, Divider, Stack, Typography } from '@mui/material';

import { formatDate } from '~/utils/client/dates';
import { MunicipalityAgreementData } from '~/utils/server/repositories/agreement.server';
import { InitialConsultationData } from '~/utils/server/repositories/initialConsultation.server';
import { InvoicingData } from '~/utils/server/repositories/invoicing.server';

interface Props {
  initialConsultation: InitialConsultationData;
  agreement: MunicipalityAgreementData;
  invoicing: InvoicingData[];
}

export function ProcessCard({ initialConsultation, agreement, invoicing }: Props) {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" component="h2">
          Process
        </Typography>

        <Stack spacing={2} sx={{ mt: 2 }}>
          <Box>
            <Typography gutterBottom fontWeight="bold">
              Initial consultation
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography>Sent</Typography>
              {initialConsultation.documentSent || initialConsultation.dateSigned ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}
              <Typography>
                {initialConsultation.documentSent
                  ? formatDate(initialConsultation.documentSent as unknown as string)
                  : null}
              </Typography>
              <Typography>Signed</Typography>
              {initialConsultation.isSigned ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}
              <Typography>
                {initialConsultation.dateSigned
                  ? formatDate(initialConsultation.dateSigned as unknown as string)
                  : null}
              </Typography>
              <Typography>Shared</Typography>
              {initialConsultation.dateShared ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}
            </Stack>
          </Box>
          <Divider />
          <Box>
            <Typography gutterBottom fontWeight="bold">
              Agreement
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center">
              <Typography>Sent</Typography>

              {agreement.newAgreementDateSent ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}

              <Typography>
                {agreement.newAgreementDateSent
                  ? formatDate(agreement.newAgreementDateSent as unknown as string)
                  : null}
              </Typography>
              <Typography>Signed</Typography>

              {agreement.newAgreementDateSigned ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}

              <Typography>
                {agreement.newAgreementDateSigned
                  ? formatDate(agreement.newAgreementDateSigned as unknown as string)
                  : null}
              </Typography>
              <Typography>Shared</Typography>

              {agreement.newAgreementShared ? (
                <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
              ) : (
                <List sx={{ color: (theme) => theme.palette.warning.main }} />
              )}
            </Stack>
          </Box>
          <Divider />
          <Box>
            <Typography gutterBottom fontWeight="bold">
              Payment info
            </Typography>
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              {invoicing.map((data) => (
                <Stack key={data.year} direction="row" spacing={2} alignItems="center">
                  <Typography>Sent for {data.year}</Typography>
                  {data.invoiceInfoSent || data.invoiceDate ? (
                    <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
                  ) : (
                    <List sx={{ color: (theme) => theme.palette.warning.main }} />
                  )}
                </Stack>
              ))}
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
