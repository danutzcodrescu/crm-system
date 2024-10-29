/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextField } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Cell, flexRender, Row } from '@tanstack/react-table';
import dayjs from 'dayjs';

interface Props {
  cell: Cell<any, any>;
  row: Row<any>;
  editedRow: string | null;
}

export function EditableTableCell({ row, cell, editedRow }: Props) {
  if (cell.id.endsWith('_actions') || editedRow !== row.id) {
    return flexRender(cell.column.columnDef.cell, cell.getContext());
  }

  if (cell.id.endsWith('_date')) {
    return (
      <DatePicker
        label={cell.column.columnDef.header as string}
        name={cell.column.columnDef.id as string}
        defaultValue={dayjs(cell.getValue())}
        sx={{ minWidth: 150 }}
        slotProps={{ textField: { slotProps: { htmlInput: { form: 'table_form' } } } }}
      />
    );
  }

  return (
    <TextField
      multiline
      rows={5}
      label={cell.column.columnDef.header as string}
      name={cell.column.columnDef.id as string}
      size="small"
      fullWidth
      defaultValue={cell.getValue()}
      slotProps={{ htmlInput: { form: 'table_form', name: cell.column.columnDef.id as string } }}
    />
  );
}
