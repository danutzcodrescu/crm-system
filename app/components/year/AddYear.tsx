import Add from '@mui/icons-material/Add';
import { IconButton, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';

import { AddItem } from '../shared/AddItem';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function AddYear({ fetcher }: Props) {
  return (
    <AddItem
      fetcher={fetcher}
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
        <Tooltip title="Create new year">
          <IconButton aria-label="Create new year" onClick={onClick}>
            <Add />
          </IconButton>
        </Tooltip>
      )}
    />
  );
}
