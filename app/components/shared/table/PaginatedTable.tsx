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
  Typography,
} from '@mui/material';
import {
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  RowData,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { ColumnVisibility } from './ColumnVisibility';
import { Filter } from './Filter';
import { booleanFilterFn, dateFilterFn } from './filters';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterOptions?: { label: string; value: unknown }[];
    filterOptionsLabel?: string;
    filterByDate?: true;
  }

  interface FilterFns {
    boolean: FilterFn<unknown>;
    dateRange: FilterFn<unknown>;
  }
}

interface Props<T> {
  columns: ColumnDef<T>[];
  data: T[];
  action?: string;
  warningMessage?: string;
}

export function PaginatedTable<T extends { id: string; warning?: boolean }>({
  data,
  columns,
  warningMessage,
}: Props<T>) {
  const [dt, setDt] = useState(data);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [columnVisibility, setColumnVisibility] = useState(
    columns.reduce(
      (acc, col) => {
        if (col.id === 'actions') return acc;
        acc[col.id as string] = true;
        return acc;
      },
      {} as Record<string, boolean>,
    ),
  );

  const table = useReactTable({
    data: dt,
    columns,
    // Pipeline
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    initialState: {
      pagination: {
        pageSize: 50,
      },
    },
    defaultColumn: {
      size: 150,
      minSize: 100,
      maxSize: Number.MAX_SAFE_INTEGER,
    },
    maxMultiSortColCount: 1,
    //
    // debugTable: process.env.NODE_ENV === 'development' ? true : false,
    state: {
      columnFilters,
      columnVisibility,
    },
    filterFns: {
      boolean: booleanFilterFn,
      dateRange: dateFilterFn,
    },
  });

  useEffect(() => {
    setDt(data);
  }, [data]);

  const { pageSize, pageIndex } = table.getState().pagination;

  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" gap={3} alignItems="center">
        <ColumnVisibility table={table} />
        <Typography component="p">Columns: {table.getFilteredRowModel().rows.length}</Typography>
      </Stack>
      <TableContainer component={Paper} sx={{ maxWidth: '100%', height: 'calc(100vh - 170px)' }}>
        <Table sx={{ minWidth: 650 }} stickyHeader>
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
                        minWidth: header.getSize(),
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
                          minWidth: cell.column.getSize(),
                        }}
                      >
                        <Stack direction="row" gap={1} alignItems="center">
                          {index === 0 && row.original?.warning ? (
                            <Tooltip title={warningMessage}>
                              <ErrorOutline sx={{ fontSize: '0.75rem' }} />
                            </Tooltip>
                          ) : null}
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
      />
    </Box>
  );
}
