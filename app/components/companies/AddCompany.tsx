import PersonAddAlt from '@mui/icons-material/PersonAddAlt';
import { IconButton, MenuItem, Select, Tooltip } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';

import { AddItem } from '../shared/AddItem';

interface Props {
  statuses: { name: string; id: string }[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function AddCompany({ statuses, fetcher }: Props) {
  return (
    <AddItem
      title="Add new commune"
      fetcher={fetcher}
      fields={[
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Commune name',
          placeholder: 'Commune name',
        },
        {
          name: 'code',
          type: 'text',
          required: true,
          label: 'Commune code',
          placeholder: 'Commune code',
        },

        {
          name: 'status',
          type: 'text',
          required: true,
          render: () => (
            <Select size="small" name="status" defaultValue="" displayEmpty>
              <MenuItem value="" disabled>
                Status
              </MenuItem>
              {statuses.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.name}
                </MenuItem>
              ))}
            </Select>
          ),
        },
      ]}
      renderAddButton={({ onClick }) => (
        <Tooltip title="Create new commune" placement="top">
          <IconButton aria-label="Create new commune" onClick={onClick}>
            <PersonAddAlt />
          </IconButton>
        </Tooltip>
      )}
    />
  );
}
