import Edit from '@mui/icons-material/Edit';
import { Box, Card, CardContent, IconButton, Stack, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { ReportingData } from '~/utils/server/repositories/reporting.server';

import { EditDialog } from '../shared/EditDialog.client';

interface Props {
  data: ReportingData[];
  fetcher: FetcherWithComponents<{ message: string; severity: string }>;
}

export function ReportingCard({ data, fetcher }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  // Get unique years from data
  const years = [...new Set(data.map((item) => item.year))].sort();

  const handleEdit = (year: ReportingData) => {
    setEditableData([
      {
        label: 'id',
        name: 'companyId',
        type: 'text',
        defaultValue: year.id,
        hidden: true,
      },
      {
        label: 'year',
        name: 'year',
        type: 'number',
        defaultValue: year.year,
        hidden: true,
      },
      {
        label: 'Reporting date',
        name: 'reportingDate',
        type: 'date',
        defaultValue: (year.reportingDate as unknown as string) || undefined,
      },
      {
        label: 'Cigarette butts (kg)',
        name: 'cigaretteButts',
        type: 'number',
        defaultValue: year.cigaretteButts || undefined,
      },
      {
        label: 'Motivation for data',
        name: 'motivationForData',
        type: 'text',
        select: true,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        defaultValue: !!year.motivationForData,
      },
      {
        label: 'Motivation',
        name: 'motivation',
        type: 'text',
        multiline: true,
        maxRows: 5,
        defaultValue: year.motivation || undefined,
      },
    ]);
  };

  return (
    <>
      <Card>
        <CardContent>
          <Stack direction="column" gap={2}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Reported quantity for different years:
              </Typography>
              <Box sx={{ border: 1, borderColor: 'divider' }}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: `1fr repeat(${years.length}, 1fr)`,
                    '& > *': {
                      borderBottom: 1,
                      borderColor: 'divider',
                      // [`&:nth-of-type(n+${3 * (years.length + 1) + 1})`]: {
                      //   borderBottom: 'none',
                      // },
                    },
                  }}
                >
                  <Box sx={{ p: 2 }}></Box>
                  {data.map((year) => (
                    <Stack
                      key={year.year}
                      sx={{ p: 2, fontWeight: 'bold', gap: 1 }}
                      direction="row"
                      alignItems="center"
                      justifyContent="center"
                    >
                      {year.year}
                      <IconButton
                        aria-label={`Edit reporting for ${year.companyName}`}
                        onClick={() => handleEdit(year)}
                      >
                        <Edit />
                      </IconButton>
                    </Stack>
                  ))}
                  <Box sx={{ p: 2, fontWeight: 'bold' }}>KG Cigarette butts</Box>
                  {data.map((year) => (
                    <Box key={year.year} sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}>
                      {year?.cigaretteButts
                        ? Intl.NumberFormat('sv-SE').format(year.cigaretteButts || 0) + ' KG'
                        : 'N/A'}
                    </Box>
                  ))}
                  <Box sx={{ p: 2, fontWeight: 'bold' }}>Date of reporting</Box>
                  {data.map((year) => (
                    <Box key={year.year} sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}>
                      {year.reportingDate ? formatDate(year.reportingDate as unknown as string) : 'N/A'}
                    </Box>
                  ))}
                  <Box sx={{ p: 2, fontWeight: 'bold' }}>Explanation of reported quantity</Box>
                  {data.map((year) => (
                    <Box key={year.year} sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}>
                      {year.motivationForData ? 'Yes' : 'N/A'}
                    </Box>
                  ))}
                  <Box sx={{ p: 2, fontWeight: 'bold' }}>Motivation</Box>
                  {data.map((year) => (
                    <Box key={year.year} sx={{ p: 2, textAlign: 'center', cursor: 'pointer' }}>
                      {year.motivation ?? 'N/A'}
                    </Box>
                  ))}
                </Box>
              </Box>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit reporting for ${data?.find((d) => d.id === fields[0]?.defaultValue)?.companyName} for ${fields[1]?.defaultValue}`}
            fetcher={fetcher}
            url="/reporting"
          />
        )}
      </ClientOnly>
    </>
  );
}
