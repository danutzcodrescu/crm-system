import { Stack, Typography } from '@mui/material';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditItem } from '~/hooks/edit';

import { EditForm } from '../EditForm';
import { StatusButtons } from '../status/StatusButtons.client';

interface Props {
  name: number;
  inflationRate: number;
  deleteYear: (name: number) => void;
}

export function YearItem({ name, inflationRate, deleteYear }: Props) {
  const { isEditing, setEditingState } = useEditItem();
  return (
    <Stack
      sx={{
        boxShadow: (theme) => theme.shadows[15],
        border: '1px solid',
        borderColor: (theme) => theme.palette.grey[400],
        borderRadius: 1,
        padding: 1.5,
      }}
      direction="row"
      alignItems="center"
      justifyContent="space-between"
      gap={2.5}
    >
      {isEditing ? (
        <EditForm
          fields={[
            { name: 'name', type: 'number', required: true, defaultValue: name, placeholder: 'Name' },
            {
              name: 'inflationRate',
              defaultValue: inflationRate,
              type: 'number',
              inputProps: { min: '0', step: '0.01' },
            },
          ]}
          onCancel={() => setEditingState(false)}
          method="PATCH"
        />
      ) : (
        <>
          <Typography sx={{ fontWeight: 'bold', flex: 1 }}>{name}</Typography>
          <Typography>inflation rate {inflationRate}%</Typography>
          <ClientOnly>
            {() => (
              <StatusButtons
                name={name.toString()}
                onDelete={() => deleteYear(name)}
                onEditButtonClick={() => setEditingState(true)}
              />
            )}
          </ClientOnly>
        </>
      )}
    </Stack>
  );
}