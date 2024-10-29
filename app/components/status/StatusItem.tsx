import { Stack, Typography } from '@mui/material';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditItem } from '~/hooks/edit';

import { EditForm } from '../EditForm';
import { StatusButtons } from './StatusButtons.client';

interface Props {
  id: string;
  name: string;
  deleteStatus: (id: string) => void;
}

export function StatusItem({ id, name, deleteStatus }: Props) {
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
            { name: 'statusName', type: 'text', required: true, defaultValue: name, placeholder: 'Name' },
            { name: 'id', defaultValue: id, type: 'text', hidden: true },
          ]}
          onCancel={() => setEditingState(false)}
          method="PATCH"
        />
      ) : (
        <ClientOnly>
          {() => (
            <>
              <Typography sx={{ fontWeight: 'bold', flex: 1 }}>{name}</Typography>
              <StatusButtons
                name={`status ${name}`}
                onDelete={() => deleteStatus(id)}
                onEditButtonClick={() => setEditingState(true)}
              />
            </>
          )}
        </ClientOnly>
      )}
    </Stack>
  );
}
