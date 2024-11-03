/* eslint-disable @typescript-eslint/no-explicit-any */
import Close from '@mui/icons-material/Close';
import Edit from '@mui/icons-material/Edit';
import Preview from '@mui/icons-material/Preview';
import Save from '@mui/icons-material/Save';
import { IconButton, Stack, Tooltip } from '@mui/material';
import { Link } from '@remix-run/react';
import { Row, Table } from '@tanstack/react-table';

import { DeleteButton } from './DeleteButton';
import { MetaType } from './PaginatedTable';

type Props = (EditableProps | ViewProps) & {
  name: string;
  id: string;
  onDelete: (id: string) => void;
};

interface EditableProps {
  isEditable: true;
  isEditing: boolean;
  tableApi: Table<any>;
  row: Row<any>;
}

interface ViewProps {
  link: string;
  isEditable: false;
}

export function TableActionsCell({ name, id, onDelete, isEditable, ...rest }: Props) {
  if ((rest as EditableProps).isEditing) {
    return (
      <Stack direction="row" gap={0.5}>
        <Tooltip title={`Cancel`}>
          <IconButton
            size="small"
            aria-label={`Cancel`}
            onClick={() => ((rest as EditableProps).tableApi.options.meta as MetaType).setEditedRow(null)}
          >
            <Close />
          </IconButton>
        </Tooltip>
        <Tooltip title={`Save`}>
          <IconButton size="small" aria-label={`Save`} color="primary" form="table_form" type="submit">
            <Save />
          </IconButton>
        </Tooltip>
      </Stack>
    );
  }
  return (
    <Stack direction="row" gap={0.5}>
      {!isEditable ? (
        <Tooltip title={`View ${name}`}>
          <IconButton size="small" aria-label={`View ${name}`} component={Link} to={(rest as ViewProps).link}>
            <Preview />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={`Edit ${name}`}>
          <IconButton
            size="small"
            aria-label={`Edit ${name}`}
            onClick={() =>
              ((rest as EditableProps).tableApi.options.meta as MetaType).setEditedRow((rest as EditableProps).row.id)
            }
          >
            <Edit />
          </IconButton>
        </Tooltip>
      )}
      <DeleteButton title={name} onClick={() => onDelete(id)} />
    </Stack>
  );
}
