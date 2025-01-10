import ViewWeek from '@mui/icons-material/ViewWeek';
import { Checkbox, FormControlLabel, FormGroup, IconButton, Popover, Tooltip, Typography } from '@mui/material';
import { Table } from '@tanstack/react-table';
import { useState } from 'react';

interface Props<T> {
  table: Table<T>;
}

export function ColumnVisibility<T>({ table }: Props<T>) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  return (
    <>
      <Tooltip title="Column visibility">
        <IconButton onClick={(event) => setAnchorEl(event.currentTarget)}>
          <ViewWeek />
        </IconButton>
      </Tooltip>

      <Popover
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        onClose={() => setAnchorEl(null)}
        open={!!anchorEl}
      >
        <Typography component="p" fontWeight="bold">
          Toggle columns
        </Typography>
        <FormGroup>
          {table.getAllLeafColumns().map((column) => (
            <FormControlLabel
              control={<Checkbox checked={column.getIsVisible()} onChange={column.getToggleVisibilityHandler()} />}
              label={column.columnDef.header as string}
              key={column.id}
              disabled={!column.getCanHide()}
            />
          ))}
        </FormGroup>
      </Popover>
    </>
  );
}
