import Delete from '@mui/icons-material/Delete';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Tooltip } from '@mui/material';
import { useState } from 'react';

interface Props {
  title: string;
  onClick: () => void;
}

export function DeleteButton({ title, onClick }: Props) {
  const [isModalOpen, setModalStatus] = useState(false);
  return (
    <>
      <Tooltip title={`Delete ${title}`}>
        <IconButton color="error" aria-label={`Delete ${title}`} onClick={() => setModalStatus(true)}>
          <Delete />
        </IconButton>
      </Tooltip>
      <Dialog open={isModalOpen} onClose={() => setModalStatus(false)}>
        <DialogTitle>{`Delete ${title}`}</DialogTitle>
        <DialogContent>Are you sure you want to delete {title}?</DialogContent>
        <DialogActions>
          <Box sx={{ display: 'flex', flexDirection: 'row-reverse', gap: 1.5 }}>
            <Button
              color="error"
              onClick={() => {
                setModalStatus(false);
                onClick();
              }}
            >
              Delete
            </Button>
            <Button onClick={() => setModalStatus(false)}>Cancel</Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}
