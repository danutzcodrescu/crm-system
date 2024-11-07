import Edit from '@mui/icons-material/Edit';
import { IconButton, Stack, Tooltip } from '@mui/material';

import { DeleteButton } from '../shared/DeleteButton';

interface Props {
  name: string;
  onDelete: () => void;
  onEditButtonClick: () => void;
}

export function StatusButtons({ name, onDelete, onEditButtonClick }: Props) {
  return (
    <Stack direction="row" gap={0.5}>
      <Tooltip title={`Edit ${name}`}>
        <IconButton size="small" aria-label={`Edit ${name}`} onClick={onEditButtonClick}>
          <Edit />
        </IconButton>
      </Tooltip>
      <DeleteButton title={name} onClick={onDelete} />
    </Stack>
  );
}
