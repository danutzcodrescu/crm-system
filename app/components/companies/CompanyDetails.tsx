import { Box, MenuItem, Select, Typography } from '@mui/material';

import { EditForm } from '../EditForm';

interface Props {
  statusName: string;
  statusId: string;
  isEditing: boolean;
  onCancel: () => void;
  statuses: { name: string; id: string }[];
}

export function CompanyDetails({ statusName, statusId, isEditing, onCancel, statuses }: Props) {
  if (isEditing) {
    return (
      <EditForm
        onCancel={onCancel}
        method="PATCH"
        fields={[
          {
            name: 'status',
            type: 'text',
            required: true,
            defaultValue: statusName,
            render: () => (
              <Select defaultValue={statusId}>
                {statuses.map((status) => (
                  <MenuItem dense key={status.id} value={status.id}>
                    {status.name}
                  </MenuItem>
                ))}
              </Select>
            ),
          },
        ]}
      />
    );
  }
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
      <Typography>
        <strong>Status:</strong> {statusName}
      </Typography>
    </Box>
  );
}
