import { Autocomplete, CircularProgress, TextField } from '@mui/material';
import { useFetcher, useNavigate } from '@remix-run/react';
import { useCallback, useState } from 'react';

import { loader } from '~/api/municipalities/layout';

export function SearchBox() {
  const [open, setOpen] = useState(false);
  const fetcher = useFetcher<typeof loader>();
  const navigate = useNavigate();

  const handleOpen = useCallback(() => {
    setOpen(true);
    if (!fetcher.data?.message?.length) {
      fetcher.submit({}, { method: 'GET', action: '/api/municipalities', relative: 'path' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data?.message]);

  const handleClose = useCallback(() => {
    setOpen(false);
  }, []);

  return (
    <Autocomplete
      sx={{ width: 300 }}
      size="small"
      onClose={handleClose}
      open={open}
      onOpen={handleOpen}
      isOptionEqualToValue={(option, value) => option?.id === value?.id}
      getOptionLabel={(option) => `${option?.name} (${option?.code})`}
      // @ts-expect-error it works
      options={fetcher.data?.message || []}
      loading={fetcher.state === 'loading'}
      filterOptions={(options, { inputValue }) =>
        options.filter(
          (option) =>
            option.name.toLowerCase().includes(inputValue.toLowerCase()) ||
            option.code.toLowerCase().includes(inputValue.toLowerCase()),
        )
      }
      disableClearable
      clearOnEscape
      clearOnBlur
      onChange={(_, value) => {
        if (value?.id) {
          navigate(`/municipalities/${value?.id}`);
        }
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder="Search for a municipality"
          sx={{ backgroundColor: (theme) => theme.palette.background.paper, borderRadius: 1 }}
          slotProps={{
            htmlInput: {
              ...params.inputProps,
            },
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {fetcher.state === 'loading' ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
    />
  );
}
