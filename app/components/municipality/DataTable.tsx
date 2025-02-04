import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import Edit from '@mui/icons-material/Edit';
import { IconButton, Stack, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { ReactNode } from 'react';

import { formatDate } from '~/utils/client/dates';

export interface Column<T> {
  label: string;
  key: keyof T;
  render?: (value: T[keyof T]) => ReactNode;
}

interface Props<T> {
  data: T[];
  onEdit?: (item: T) => void;
  columns: Column<T>[];
  yearKey: keyof T;
  nameKey: keyof T;
}

export function DataTable<T>({ data, onEdit, columns, yearKey, nameKey }: Props<T>) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell></TableCell>
            {data.map((item) => (
              <TableCell key={item[yearKey] as number} align="center">
                <Stack direction="row" alignItems="center" justifyContent="center" gap={1}>
                  {item[yearKey] as number}
                  {onEdit ? (
                    <IconButton
                      aria-label={`Edit information for ${String(item[nameKey])}`}
                      onClick={() => onEdit(item)}
                      size="small"
                    >
                      <Edit />
                    </IconButton>
                  ) : null}
                </Stack>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {columns.map((column) => (
            <TableRow key={String(column.key)}>
              <TableCell component="th" scope="row" sx={{ fontWeight: 'bold' }}>
                {column.label}
              </TableCell>
              {data.map((item) => (
                <TableCell key={item[yearKey] as number} align="center">
                  {column.render ? column.render(item[column.key]) : String(item[column.key] ?? 'N/A')}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// Helper function to format numbers in Swedish format
const formatNumber = (value: number | null | undefined, options?: Intl.NumberFormatOptions): string => {
  if (value == null) return 'N/A';
  return Intl.NumberFormat('sv-SE', options).format(value);
};

// Predefined render functions for common cases
export const renderBoolean = (value: unknown): ReactNode => {
  if (value === true) return <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />;
  if (value === false) return <Cancel sx={{ color: (theme) => theme.palette.error.main }} />;
  return 'N/A';
};

export const renderNumber = (value: unknown): string => {
  if (typeof value === 'number') return formatNumber(value);
  return 'N/A';
};

export const renderNumberWithDecimals = (value: unknown, decimals: number = 10): string => {
  if (typeof value === 'number') return formatNumber(value, { minimumFractionDigits: decimals });
  return 'N/A';
};

export const renderDate = (value: unknown): string => {
  if (value) {
    return formatDate(value as string);
  }
  return 'N/A';
};
