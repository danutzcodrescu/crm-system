import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import {
  Box,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tooltip,
} from '@mui/material';
import { useFetcher } from '@remix-run/react';
import {
  CellContext,
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  SortingFn,
  useReactTable,
} from '@tanstack/react-table';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { EditableTableCell } from './EditableTableCell';
import { Filter } from './Filter';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    editedRow: string | null;
    setEditedRow: (val: string | null) => void;
  }

  interface ColumnMeta<TData extends RowData, TValue> {
    editField?: (params: Pick<CellContext<TData, TValue>, 'row' | 'cell'>) => ReactNode;
    filterOptions?: string[];
    editFieldType?: 'textarea' | 'date' | 'email' | 'text' | 'phone';
  }
}

type TData = Record<string, unknown> & { id: string };

const sortByNewRowFirst: SortingFn<TData> = (rowA, rowB, columnId) => {
  if (rowA.original.id === '') {
    return -1;
  }
  if (rowB.original.id === '') {
    return 1;
  }

  // @ts-expect-error type mismatch
  return rowA.original[columnId] > rowB.original[columnId]
    ? 1
    : // @ts-expect-error type mismatch
      rowA.original[columnId] < rowB.original[columnId]
      ? -1
      : 0;
};

interface Props<T> {
  columns: ColumnDef<T>[];
  data: T[];
  action?: string;
  actionAccessor?: string;
  updateFetcher?: ReturnType<typeof useFetcher>;
  newRowObject?: T;
  createNewRow?: (triggerNewRow: () => void) => ReactNode;
  warningMessage?: string;
}

export function PaginatedTable<T extends { id: string; warning?: boolean }>({
  data,
  columns,
  action,
  actionAccessor,
  updateFetcher,
  newRowObject,
  createNewRow: newRow,
  warningMessage,
}: Props<T>) {
  // TODO refactor to useReducer
  const [dt, setDt] = useState(data);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [editedRow, setEditedRow] = useState<string | null>(null);
  const [formMethod, setFormMethod] = useState<'PATCH' | 'POST'>('PATCH');

  const table = useReactTable({
    data: dt,
    columns,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    maxMultiSortColCount: 1,
    //
    // debugTable: process.env.NODE_ENV === 'development' ? true : false,
    state: {
      columnFilters,
    },
    sortingFns: {
      sortByNewRowFirst: sortByNewRowFirst,
    },
    meta: {
      editedRow,
      setEditedRow: (value: string | null) => {
        if (value === null && editedRow === '0' && dt[0]?.id === undefined) {
          setDt((prev) => prev.slice(1));
        }
        setEditedRow(value);
      },
    },
  });

  useEffect(() => {
    if (updateFetcher?.state === 'idle' && editedRow) {
      setEditedRow(null);
      setFormMethod('PATCH');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [updateFetcher?.state]);

  const createNewRow = useCallback(() => {
    setDt((prev) => [newRowObject as T, ...prev]);
    setEditedRow('0');
    setFormMethod('POST');
  }, [newRowObject]);

  useEffect(() => {
    setDt(data);
  }, [data]);

  const { pageSize, pageIndex } = table.getState().pagination;

  return (
    <Box
      sx={{ width: '100%' }}
      component={updateFetcher?.Form || Box}
      id="table_form"
      method={formMethod}
      {...(editedRow
        ? {
            action:
              formMethod === 'POST'
                ? action
                : // @ts-expect-error type mismatch
                  `${action?.replace('?index', '')}/${data[parseInt(editedRow)][actionAccessor]}`,
            navigate: false,
          }
        : {})}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>{newRow ? newRow(createNewRow) : null}</Box>
      <TableContainer component={Paper} sx={{ overflow: 'auto' }}>
        <Table sx={{ minWidth: 650 }} aria-label="simple table">
          <TableHead>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableCell
                      key={header.id}
                      colSpan={header.colSpan}
                      sx={{
                        cursor: header.column.getCanSort() ? 'pointer' : 'default',
                        // @ts-expect-error type mismatch
                        ...(header.column.columnDef.width ? { width: header.column.columnDef.width } : {}),
                      }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      <Stack width="100%" direction="row" alignItems="center" gap={1}>
                        <Box component="span" sx={{ flex: 1 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Box>
                        <Stack component={'span'} gap={1} direction="row">
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpward />
                          ) : header.column.getIsSorted() === 'desc' ? (
                            <ArrowDownward />
                          ) : null}
                          {header.column.getCanFilter() ? <Filter column={header.column} /> : null}
                        </Stack>
                      </Stack>
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableHead>
          <TableBody>
            {table.getRowModel().rows.map((row) => {
              return (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell, index) => {
                    return (
                      <TableCell
                        key={cell.id}
                        sx={{
                          color: (theme) =>
                            row.original?.warning ? theme.palette.error.main : theme.palette.text.primary,
                          // @ts-expect-error type mismatch
                          ...(cell.column.columnDef.width ? { width: cell.column.columnDef.width } : {}),
                        }}
                      >
                        <Stack direction="row" gap={1} alignItems="center">
                          {index === 0 && row.original?.warning ? (
                            <Tooltip title={warningMessage}>
                              <ErrorOutline sx={{ fontSize: '0.75rem' }} />
                            </Tooltip>
                          ) : null}
                          <EditableTableCell cell={cell} row={row} editedRow={editedRow} />
                        </Stack>
                      </TableCell>
                    );
                  })}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        rowsPerPageOptions={[50, 100, 200]}
        component="div"
        count={table.getFilteredRowModel().rows.length}
        rowsPerPage={pageSize}
        page={pageIndex}
        slotProps={{
          select: {
            inputProps: { 'aria-label': 'rows per page' },
            native: true,
          },
        }}
        onPageChange={(_, page) => {
          table.setPageIndex(page);
        }}
        onRowsPerPageChange={(e) => {
          const size = e.target.value ? Number(e.target.value) : 10;
          table.setPageSize(size);
        }}
        // ActionsComponent={TablePaginationActions}
      />
    </Box>
  );
}
