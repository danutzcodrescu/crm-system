/* eslint-disable @typescript-eslint/no-explicit-any */
import Edit from '@mui/icons-material/Edit';
import Preview from '@mui/icons-material/Preview';
import { Box, IconButton, Stack, Tooltip } from '@mui/material';
import { Link } from '@remix-run/react';
import { ReactNode } from 'react';

type Props = {
  name: string;
  id: string;
  additionalElement?: ReactNode;
  isEditable: boolean;
  link?: string;
  onEdit: (id: string) => void;
};

export function TableActionsCell({ name, id, additionalElement, isEditable, link, onEdit }: Props) {
  return (
    <Stack direction="row" gap={0.5}>
      {additionalElement || <Box sx={{ width: 40, height: 40 }}></Box>}
      {isEditable ? (
        <Tooltip title={`Edit ${name}`}>
          <IconButton size="small" aria-label={`Edit ${name}`} onClick={() => onEdit(id)}>
            <Edit />
          </IconButton>
        </Tooltip>
      ) : null}
      {link ? (
        <Tooltip title={`View ${name}`}>
          <IconButton size="small" aria-label={`View ${name}`} component={Link} to={link} prefetch="intent">
            <Preview />
          </IconButton>
        </Tooltip>
      ) : null}

      {/* <DeleteButton title={name} onClick={() => onDelete(id)} /> */}
    </Stack>
  );
}
