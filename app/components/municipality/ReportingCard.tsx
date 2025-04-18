import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { ReportingData } from '~/utils/server/repositories/reporting.server';

import { EditDialog } from '../shared/EditDialog.client';
import { Column, DataTable, renderDate, renderNumber } from './DataTable';

interface Props {
  data: ReportingData[];
  fetcher: FetcherWithComponents<unknown>;
}

export function ReportingCard({ data, fetcher }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const handleEdit = useCallback(
    (year: ReportingData) => {
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
          inputProps: { step: '0.01' },
          defaultValue: year.cigaretteButts || undefined,
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
    },
    [setEditableData],
  );

  return (
    <>
      <Card>
        <CardContent>
          <Stack direction="column" gap={2}>
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Reported quantity for different years:
              </Typography>
              <ReportingTable data={data} onEdit={handleEdit} />
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

export function ReportingTable({ data, onEdit }: { data: ReportingData[]; onEdit: (year: ReportingData) => void }) {
  const columns: Column<ReportingData>[] = [
    {
      label: 'KG Cigarette butts',
      key: 'cigaretteButts',
      render: renderNumber,
    },
    {
      label: 'Date of reporting',
      key: 'reportingDate',
      render: renderDate,
    },
    // {
    //   label: 'Explanation of reported quantity',
    //   key: 'motivationForData',
    //   render: (value, ),
    // },
    {
      label: 'Motivation',
      key: 'motivation',
      render: (value) => String(value ?? 'N/A'),
    },
  ];

  return <DataTable data={data} onEdit={onEdit} columns={columns} yearKey="year" nameKey="companyName" />;
}
