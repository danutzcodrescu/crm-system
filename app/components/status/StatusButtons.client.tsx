import Delete from '@mui/icons-material/Delete';
import Edit from '@mui/icons-material/Edit';
import { IconButton, Stack } from '@mui/material';

interface Props {
  name: string;
  onDelete: () => void;
  onEditButtonClick: () => void;
}

export function StatusButtons({ name, onDelete, onEditButtonClick }: Props) {
  return (
    <Stack direction="row" gap={0.5}>
      <IconButton size="small" aria-label={`Edit status ${name}`} onClick={onEditButtonClick}>
        <Edit />
      </IconButton>
      <IconButton color="error" size="small" aria-label={`Delete status ${name}`} onClick={onDelete}>
        <Delete />
      </IconButton>
    </Stack>
  );
}
