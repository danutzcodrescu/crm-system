import { PersonAddAlt } from '@mui/icons-material';
import { Autocomplete, IconButton, TextField } from '@mui/material';
import { useFetcher } from '@remix-run/react';

import { loader } from '~/api/companies/route';

import { AddItem } from '../shared/AddItem';

export function AddContact() {
  const fetcher = useFetcher<typeof loader>();
  return (
    <AddItem
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
              // @ts-expect-error let's see
              options={fetcher.data?.message || []}
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
                        (fetcher?.data?.message as { id: string; name: string }[])?.find(
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
        <IconButton
          aria-label="Create new contact"
          title="Create new contact"
          onClick={() => {
            fetcher.submit({}, { method: 'GET', action: '/api/companies', relative: 'path' });
            onClick();
          }}
        >
          <PersonAddAlt />
        </IconButton>
      )}
    />
  );
}
