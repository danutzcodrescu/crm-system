import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { GeneralInformationPerMunicipality } from '~/utils/server/repositories/generalInformation.server';

import { EditDialog } from '../shared/EditDialog.client';
import { Column, DataTable, renderBoolean, renderNumber, renderNumberWithDecimals } from './DataTable';

interface Props {
  data: GeneralInformationPerMunicipality[];
  fetcher: FetcherWithComponents<unknown>;
}

export function GeneralInformationCard({ data, fetcher }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const handleEdit = (year: GeneralInformationPerMunicipality) => {
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
        label: 'Land surface (km²)',
        name: 'landSurface',
        type: 'number',
        defaultValue: typeof year.landSurface === 'number' ? year.landSurface : undefined,
      },
      {
        label: 'Inhabitants',
        name: 'inhabitants',
        type: 'number',
        defaultValue: typeof year.inhabitants === 'number' ? year.inhabitants : undefined,
      },
      {
        label: 'Cleaning costs',
        name: 'cleaningCost',
        type: 'number',
        defaultValue: typeof year.cleaningCost === 'number' ? year.cleaningCost : undefined,
      },
      {
        label: 'Cleaned up KG cigarette butts',
        name: 'cleanedKg',
        type: 'number',
        defaultValue: typeof year.cleanedKg === 'number' ? year.cleanedKg : undefined,
      },
      {
        label: 'EPA littering measurement',
        name: 'epaLitterMeasurement',
        type: 'text',
        select: true,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        defaultValue: year.epaMeasurement,
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
                General information for different years:
              </Typography>
              <GeneralInformationTable data={data} onEdit={handleEdit} />
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
            title={`Edit general information for ${data?.find((d) => d.id === fields[0]?.defaultValue)?.companyName} for ${fields[1]?.defaultValue}`}
            fetcher={fetcher}
            url="/general-information"
          />
        )}
      </ClientOnly>
    </>
  );
}

export function GeneralInformationTable({
  data,
  onEdit,
}: {
  data: GeneralInformationPerMunicipality[];
  onEdit: (year: GeneralInformationPerMunicipality) => void;
}) {
  const columns: Column<GeneralInformationPerMunicipality>[] = [
    {
      label: 'Land surface (km²)',
      key: 'landSurface',
      render: renderNumber,
    },
    {
      label: 'Inhabitants',
      key: 'inhabitants',
      render: renderNumber,
    },
    {
      label: 'Cleaning costs',
      key: 'cleaningCost',
      render: renderNumber,
    },
    {
      label: 'Cleaning costs / capita',
      key: 'cleaningCostsPerInhabitant',
      render: renderNumber,
    },
    {
      label: 'Cleaned up KG cigarette butts',
      key: 'cleanedKg',
      render: renderNumber,
    },
    {
      label: 'KG / CBs / capita',
      key: 'kgPerInhabitant',
      render: (value) => renderNumberWithDecimals(value, 10),
    },
    {
      label: 'EPA littering measurement',
      key: 'epaMeasurement',
      render: renderBoolean,
    },
  ];

  return <DataTable data={data} onEdit={onEdit} columns={columns} yearKey="year" nameKey="companyName" />;
}
