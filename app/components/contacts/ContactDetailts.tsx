import { Autocomplete, Box, TextField, Typography } from '@mui/material';
import { useFetcher } from '@remix-run/react';
import { useEffect } from 'react';

import { loader } from '~/api/companies/route';

import { EditForm } from '../EditForm';

interface Props {
  companyName: string;
  companyId: string;
  phone: string;
  email: string;
  isEditing: boolean;
  onCancel: () => void;
}

export function ContactDetails({ companyName, phone, email, isEditing, companyId, id, onCancel }: Props) {
  const fetcher = useFetcher<typeof loader>();
  useEffect(() => {
    if (isEditing) {
      fetcher.submit({}, { method: 'GET', action: '/api/companies', relative: 'path' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  if (isEditing) {
    return (
      <EditForm
        fields={[
          {
            name: 'companyName',
            type: 'text',
            required: true,
            defaultValue: companyId,
            render: () => (
              <Autocomplete
                // @ts-expect-error let's see
                options={fetcher.data?.message || []}
                getOptionLabel={(option) => option.name}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                size="small"
                defaultValue={{ id: companyId, name: companyName }}
                loading={fetcher.state === 'loading'}
                sx={{ flex: 1 }}
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
            name: 'phone',
            type: 'tel',
            required: true,
            label: 'Phone',
            defaultValue: phone,
          },
          {
            name: 'email',
            type: 'email',
            required: true,
            label: 'Email',
            defaultValue: email,
          },
        ]}
        onCancel={onCancel}
        method="PATCH"
      />
    );
  }
  return (
    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 1.5 }}>
      <Typography>
        <strong>Company name:</strong> {companyName}
      </Typography>
      <Typography>
        <strong>Phone:</strong> {phone}
      </Typography>
      <Typography>
        <strong>Email:</strong> {email}
      </Typography>
    </Box>
  );
}
