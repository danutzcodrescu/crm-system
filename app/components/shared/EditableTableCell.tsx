/* eslint-disable @typescript-eslint/no-explicit-any */
import { TextField } from '@mui/material';
import { Cell, flexRender, Row } from '@tanstack/react-table';
import dayjs from 'dayjs';
import { lazy, Suspense } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

const DatePicker = lazy(() =>
  import('@mui/x-date-pickers/DatePicker').then((module) => ({ default: module.DatePicker })),
);

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
      // TODO find a better way to import DatePicker
      <ClientOnly>
        {() => {
          return (
            <Suspense fallback={null}>
              <DatePicker
                label={cell.column.columnDef.header as string}
                name={cell.column.columnDef.id as string}
                defaultValue={dayjs(cell.getValue())}
                sx={{ minWidth: 150 }}
                slotProps={{ textField: { slotProps: { htmlInput: { form: 'table_form' } } } }}
              />
            </Suspense>
          );
        }}
      </ClientOnly>
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
