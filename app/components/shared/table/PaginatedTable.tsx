import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import SwapVert from '@mui/icons-material/SwapVert';
import {
  Box,
  BoxProps,
  IconButton,
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
  Column,
  ColumnDef,
  ColumnFiltersState,
  FilterFn,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  Row,
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
  additionalHeader?: (rows: Row<T>[]) => React.ReactNode;
}

function cellPinning<T>(column: Column<T>): BoxProps['sx'] {
  const isPinned = column.getIsPinned();
  const isLastLeftPinnedColumn = isPinned === 'left' && column.getIsLastColumn('left');
  const isFirstRightPinnedColumn = isPinned === 'right' && column.getIsFirstColumn('right');

  return {
    boxShadow: isLastLeftPinnedColumn
      ? '-4px 0 4px -4px gray inset'
      : isFirstRightPinnedColumn
        ? '4px 0 4px -4px gray inset'
        : undefined,
    left: isPinned === 'left' ? `${column.getStart('left')}px` : undefined,
    right: isPinned === 'right' ? `${column.getAfter('right')}px` : undefined,
    position: isPinned ? 'sticky' : 'relative',
    backgroundColor: (theme) => theme.palette.background.paper,
    width: column.getSize(),
    zIndex: isPinned ? 1 : 0,
  };
}

export function PaginatedTable<T extends { id: string; warning?: boolean }>({
  data,
  columns,
  warningMessage,
  additionalHeader,
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
      sorting: [
        {
          id: 'companyName',
          desc: false,
        },
      ],
    },
    defaultColumn: {
      size: 200,
      minSize: 150,
      maxSize: Number.MAX_SAFE_INTEGER,
    },
    maxMultiSortColCount: 1,
    //
    // debugTable: process.env.NODE_ENV === 'development' ? true : false,
    state: {
      columnFilters,
      columnVisibility,
      columnPinning: {
        left: ['companyName'],
      },
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
    <Box sx={{ width: '100%', maxHeight: 'calc(100vh - 50px - 56px)' }}>
      <Stack direction="row" gap={3} alignItems="center">
        <ColumnVisibility table={table} />
        <Typography component="p">Rows: {table.getFilteredRowModel().rows.length}</Typography>
        {additionalHeader ? additionalHeader(table.getFilteredRowModel().rows) : undefined}
      </Stack>
      <TableContainer component={Paper} sx={{ maxWidth: '100%', maxHeight: 'calc(100vh - 200px)', overflow: 'auto' }}>
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
                        ...cellPinning(header.column),
                        zIndex: 2,
                        position: 'sticky',
                      }}
                    >
                      <Stack width="100%" direction="row" alignItems="center" gap={1}>
                        <Box component="span" sx={{ flex: 1 }}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </Box>
                        <Stack component={'span'} gap={1} direction="row" alignItems="center">
                          {header.column.getCanFilter() ? <Filter column={header.column} /> : null}
                          {header.column.getCanSort() ? (
                            <IconButton
                              aria-label="sort column"
                              onClick={header.column.getToggleSortingHandler()}
                              size="small"
                            >
                              <SwapVert />
                            </IconButton>
                          ) : null}
                          {header.column.getIsSorted() === 'asc' ? (
                            <ArrowUpward fontSize="small" />
                          ) : (
                            <ArrowDownward
                              fontSize="small"
                              sx={{ opacity: header.column.getIsSorted() === 'desc' ? '100%' : '0' }}
                            />
                          )}
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
                          ...cellPinning(cell.column),
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
