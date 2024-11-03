import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
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
} from '@mui/material';
import { useFetcher } from '@remix-run/react';
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table';
import { ReactNode, useCallback, useEffect, useState } from 'react';

import { EditableTableCell } from './EditableTableCell';
import { Filter } from './Filter';

interface Props<T> {
  columns: ColumnDef<T>[];
  data: T[];
  action?: string;
  actionAccessor?: string;
  updateFetcher?: ReturnType<typeof useFetcher>;
  newRowObject?: T;
  createNewRow?: (triggerNewRow: () => void) => ReactNode;
}

export type MetaType = {
  editedRow: string | null;
  setEditedRow: (id: string | null) => void;
};

export function PaginatedTable<T>({
  data,
  columns,
  action,
  actionAccessor,
  updateFetcher,
  newRowObject,
  createNewRow: newRow,
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
    meta: {
      editedRow,
      setEditedRow,
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
            // @ts-expect-error type mismatch
            action: formMethod === 'POST' ? action : `${action}/${data[parseInt(editedRow)][actionAccessor]}`,
            navigate: false,
          }
        : {})}
    >
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse' }}>{newRow ? newRow(createNewRow) : null}</Box>
      <TableContainer component={Paper}>
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
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        <EditableTableCell cell={cell} row={row} editedRow={editedRow} />
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
