import { Add } from '@mui/icons-material';
import { IconButton } from '@mui/material';

import { AddItem } from '../shared/AddItem';

export function AddYear() {
  return (
    <AddItem
      title="Create new year"
      fields={[
        {
          name: 'name',
          label: 'Year',
          placeholder: 'Year',
          type: 'number',
          required: true,
        },
        {
          name: 'inflationRate',
          label: 'Inflation rate',
          placeholder: 'Inflation rate',
          type: 'number',
          required: true,
          inputProps: {
            step: '0.01',
            min: '0',
          },
        },
      ]}
      renderAddButton={({ onClick }) => (
        <IconButton aria-label="Create new year" title="Create new year" onClick={onClick}>
          <Add />
        </IconButton>
      )}
    />
  );
}
