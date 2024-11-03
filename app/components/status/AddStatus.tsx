import Add from '@mui/icons-material/Add';
import { IconButton } from '@mui/material';
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
        <IconButton size="small" aria-label="Create new status" onClick={onClick} title="Create new status">
          <Add />
        </IconButton>
      )}
      fields={[{ name: 'statusName', type: 'text', placeholder: 'Name', label: 'Name', required: true }]}
      title="Create new status"
    />
  );
}
