import { Add } from '@mui/icons-material';
import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, TextField } from '@mui/material';
import { Form, useNavigation } from '@remix-run/react';
import { useEffect, useState } from 'react';

export function AddStatus() {
  const [isModalOpen, setModalState] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === 'idle' && isModalOpen) {
      setModalState(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state]);

  return (
    <>
      <IconButton
        size="small"
        aria-label="Create new status"
        onClick={() => setModalState(true)}
        title="Create new status"
      >
        <Add />
      </IconButton>
      <Dialog maxWidth="xs" fullWidth open={isModalOpen} onClose={() => setModalState(false)}>
        <Form method="post">
          <DialogTitle>Create new status</DialogTitle>
          <DialogContent>
            <TextField
              fullWidth
              label="Name"
              name="statusName"
              placeholder="Name"
              type="text"
              required
              size="small"
            ></TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalState(false)} color="secondary">
              Cancel
            </Button>
            <LoadingButton type="submit" color="primary" disabled={navigation.state !== 'idle'}>
              Create
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </>
  );
}
