import Receipt from '@mui/icons-material/Receipt';
import { Box, Card, CardContent, IconButton, Link, Stack, Typography } from '@mui/material';

import { CompensationDataPerCompany } from '~/utils/server/repositories/compensation.server';

import { CompensationTable } from './CompensationTable';

interface Props {
  data: CompensationDataPerCompany[];
}

export function CompensationCard({ data }: Props) {
  return (
    <Card>
      <CardContent>
        <Stack direction="column" gap={2}>
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6" component="h2" gutterBottom>
              Compensation Information:
            </Typography>
            <CompensationTable data={data} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}
