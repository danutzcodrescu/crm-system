import { Add } from '@mui/icons-material';
import { IconButton } from '@mui/material';

import { AddItem } from '../shared/AddItem';

export function AddStatus() {
  return (
    <AddItem
      renderAddButton={({ onClick }) => (
        <IconButton size="small" aria-label="Create new status" onClick={onClick} title="Create new status">
          <Add />
        </IconButton>
      )}
      fields={[{ name: 'statusName', type: 'text', placeholder: 'Name', label: 'Name', required: true }]}
      title="Create new status"
    />
  );
}
