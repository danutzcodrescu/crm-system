import Edit from '@mui/icons-material/Edit';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Card, CardContent, IconButton, Tab, Typography } from '@mui/material';
import type { FetcherWithComponents } from '@remix-run/react';
import { useCallback, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import { RecurringConsultationPerMunicipality } from '~/utils/server/repositories/recurringConsultation.server';

interface Props {
  years: number[];
  data: RecurringConsultationPerMunicipality[];
  fetcher: FetcherWithComponents<unknown>;
}

export function RecurringConsultation({ years, data, fetcher }: Props) {
  const [value, setValue] = useState(years[0]);
  const isRecurringMandatory = data.some((item) => item.agreementType === 'old');
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
  };

  const setEditableFields = useCallback(
    (yearData: RecurringConsultationPerMunicipality) => {
      const fields = [
        {
          label: 'id',
          name: 'id',
          type: 'text',
          defaultValue: yearData.id,
          hidden: true,
        },
        {
          label: 'year',
          name: 'year',
          type: 'number',
          defaultValue: value,
          hidden: true,
        },
        {
          label: 'Date for sending info + form',
          name: 'sentDate',
          type: 'date',
          defaultValue: yearData.sentDate as unknown as string,
        },
        {
          label: 'Meeting date',
          name: 'meetingDate',
          type: 'datetime',
          defaultValue: yearData.meetingDate as unknown as string,
        },
        {
          label: 'Consultation form completed',
          name: 'consultationFormCompleted',
          select: true,
          type: 'text',
          options: [
            {
              label: 'Yes',
              value: 'true',
            },
            {
              label: 'No',
              value: 'false',
            },
          ],
          defaultValue: yearData.consultationFormCompleted as unknown as string,
        },
        {
          label: 'Meeting held',
          name: 'meetingHeld',
          type: 'text',
          select: true,
          options: [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
            { label: 'N/A', value: '' },
          ],
          defaultValue: yearData.meetingHeld as unknown as string,
        },
        {
          label: 'Date shared with NPA',
          name: 'dateSharedWithAuthority',
          type: 'date',
          defaultValue: yearData.dateSharedWithAuthority as unknown as string,
        },
      ];
      if (yearData.agreementType === 'old') {
        fields.splice(2, 0, {
          label: 'First recurring consultation',
          name: 'firstRecurringConsultation',
          type: 'number',
          defaultValue: yearData.consultations[0] as unknown as string,
        });
      }
      setEditableData(fields);
    },
    [setEditableData, value],
  );

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <Typography
              variant="h6"
              component="h2"
              sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flex: 1 }}
            >
              Recurring consultation
              <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                <IconButton
                  onClick={() =>
                    setEditableFields(data.find((dt) => dt.year === value) as RecurringConsultationPerMunicipality)
                  }
                  size="small"
                  sx={{ alignSelf: 'flex-start' }}
                >
                  <Edit />
                </IconButton>
              </Box>
            </Typography>
          </Box>

          <Box sx={{ mb: 2 }}>
            <Typography variant="body1" gutterBottom>
              Recurring consultations mandatory:{' '}
              <Box component="span" sx={{ fontWeight: isRecurringMandatory ? 'bold' : 'normal' }}>
                {isRecurringMandatory ? 'Yes' : 'No'}
              </Box>
            </Typography>

            <Typography variant="body1" gutterBottom>
              Occasions for Recurring Consultation meetings:{' '}
              {years.length > 0 ? <Box component="span">{years.join(', ')}</Box> : <Box component="span">N/A</Box>}
            </Typography>
          </Box>

          {years.length > 0 ? (
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <TabList onChange={handleChange} aria-label="recurring consultation years">
                  {years.map((year) => (
                    <Tab key={year} label={`Year ${year}`} value={year} />
                  ))}
                </TabList>
              </Box>
              {data.map((dt) => {
                return (
                  <TabPanel key={dt.year} value={dt.year}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Typography>
                        Information and form sent to municipality:{' '}
                        <Box component="span">{dt.sentDate ? 'Yes' : 'No'}</Box>
                      </Typography>

                      <Typography>
                        Time for sending information and form:{' '}
                        {dt.sentDate ? (
                          <Box component="span">{formatDate(dt.sentDate as unknown as string, 'Pp')}</Box>
                        ) : (
                          <Box component="span">N/A</Box>
                        )}
                      </Typography>

                      <Typography>
                        Time scheduled with municipality:{' '}
                        {dt.meetingDate ? (
                          <Box component="span">{formatDate(dt.meetingDate as unknown as string, 'Pp')}</Box>
                        ) : (
                          <Box component="span">N/A</Box>
                        )}
                      </Typography>

                      <Typography>
                        Recurring Consultation Form shared with NPA:{' '}
                        <Box component="span">{dt.infoSharedWithAuthority ? 'Yes' : 'No'}</Box>
                      </Typography>

                      <Typography>
                        Date when Recurring Consultation form was shared with NPA:{' '}
                        {dt.dateSharedWithAuthority ? (
                          <Box component="span">{formatDate(dt.dateSharedWithAuthority as unknown as string)}</Box>
                        ) : (
                          <Box component="span">N/A</Box>
                        )}
                      </Typography>
                    </Box>
                  </TabPanel>
                );
              })}
            </TabContext>
          ) : (
            <Typography>No recurring consultations</Typography>
          )}
        </CardContent>
      </Card>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title="Edit recurring consultation"
            fetcher={fetcher}
            url="/recurring-consultation"
          />
        )}
      </ClientOnly>
    </>
  );
}
