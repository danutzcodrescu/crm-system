import { LoadingButton } from '@mui/lab';
import { Button, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import Dialog from '@mui/material/Dialog';
import { FetcherWithComponents } from '@remix-run/react';

import { EditForm, Field } from '../EditForm';

interface Props {
  title: string;
  fetcher: FetcherWithComponents<unknown>;
  fields: Field[];
  url: string;
  isOpen: boolean;
  handleClose: () => void;
  method?: 'PATCH' | 'POST';
}

export function EditDialog({ title, fetcher, fields, url, isOpen, method = 'PATCH', handleClose }: Props) {
  return (
    <Dialog maxWidth="lg" fullWidth open={isOpen} onClose={handleClose}>
      <fetcher.Form method={method} action={url}>
        <DialogTitle>{title}</DialogTitle>
        <DialogContent sx={{ paddingTop: (theme) => theme.spacing(1) + '!important' }}>
          <EditForm fields={fields} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <LoadingButton
            loading={fetcher.state !== 'idle'}
            type="submit"
            color="primary"
            disabled={fetcher.state !== 'idle'}
            variant="contained"
          >
            {method === 'POST' ? 'Create' : 'Update'}
          </LoadingButton>
        </DialogActions>
      </fetcher.Form>
    </Dialog>
  );
}
