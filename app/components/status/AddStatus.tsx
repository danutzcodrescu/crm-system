import Add from '@mui/icons-material/Add';
import { IconButton, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';

import { AddItem } from '../shared/AddItem';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function AddStatus({ fetcher }: Props) {
  return (
    <AddItem
      fetcher={fetcher}
      renderAddButton={({ onClick }) => (
        <Tooltip title="Create new status">
          <IconButton size="small" aria-label="Create new status" onClick={onClick}>
            <Add />
          </IconButton>
        </Tooltip>
      )}
      fields={[{ name: 'statusName', type: 'text', placeholder: 'Name', label: 'Name', required: true }]}
      title="Create new status"
    />
  );
}
