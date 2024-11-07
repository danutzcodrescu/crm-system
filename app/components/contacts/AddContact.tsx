import PersonAddAlt from '@mui/icons-material/PersonAddAlt';
import { Autocomplete, IconButton, TextField, Tooltip } from '@mui/material';
import { FetcherWithComponents, useFetcher } from '@remix-run/react';

import { loader } from '~/api/companies/layout';

import { AddItem } from '../shared/AddItem';

interface Props {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function AddContact({ fetcher }: Props) {
  const itemsFetcher = useFetcher<typeof loader>();
  return (
    <AddItem
      fetcher={fetcher}
      title="Add new contact"
      fields={[
        {
          name: 'name',
          type: 'text',
          required: true,
          label: 'Name',
          placeholder: 'Name',
        },

        {
          name: 'company',
          type: 'text',
          render: () => (
            <Autocomplete
              options={(itemsFetcher.data?.message as { id: string; name: string }[]) || []}
              getOptionLabel={(option) => option.name}
              isOptionEqualToValue={(option, value) => option.id === value.id}
              size="small"
              renderInput={(params) => {
                return (
                  <>
                    <TextField {...params} placeholder="Company *" required />
                    <input
                      type="hidden"
                      name="companyId"
                      value={
                        (itemsFetcher?.data?.message as { id: string; name: string }[])?.find(
                          (company) => company.name === params.inputProps.value,
                        )?.id
                      }
                    />
                  </>
                );
              }}
            />
          ),
        },
        {
          name: 'email',
          type: 'email',
          label: 'Email',
          placeholder: 'Email',
        },
        {
          name: 'phone',
          type: 'tel',
          label: 'Phone',
          placeholder: 'Phone',
        },
      ]}
      renderAddButton={({ onClick }) => (
        <Tooltip title="Create new contact">
          <IconButton
            aria-label="Create new contact"
            onClick={() => {
              itemsFetcher.load('/api/companies');
              onClick();
            }}
          >
            <PersonAddAlt />
          </IconButton>
        </Tooltip>
      )}
    />
  );
}
