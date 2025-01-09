import ArrowDownward from '@mui/icons-material/ArrowDownward';
import ArrowUpward from '@mui/icons-material/ArrowUpward';
import ErrorOutline from '@mui/icons-material/ErrorOutline';
import ViewWeek from '@mui/icons-material/ViewWeek';
import {
  Box,
  Checkbox,
  FormControlLabel,
  FormGroup,
  IconButton,
  Paper,
  Popover,
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
  Row,
  RowData,
  SortingFn,
  useReactTable,
} from '@tanstack/react-table';
import { useEffect, useState } from 'react';

import { Filter } from './Filter';

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    filterOptions?: { label: string; value: unknown }[];
    filterOptionsLabel?: string;
  }

  interface FilterFns {
    boolean: FilterFn<unknown>;
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

const booleanFilterFn: FilterFn<TData> = (row: Row<TData>, columnId: string, filterValue: boolean[]) => {
  if (filterValue.length === 0) return true;
  const value = row.original[columnId] as boolean;
  return filterValue.includes(value);
};

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
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
    sortingFns: {
      sortByNewRowFirst: sortByNewRowFirst,
    },
    filterFns: {
      boolean: booleanFilterFn,
    },
  });

  useEffect(() => {
    setDt(data);
  }, [data]);

  const { pageSize, pageIndex } = table.getState().pagination;

  return (
    <Box sx={{ width: '100%' }}>
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
      <TableContainer component={Paper} sx={{ overflow: 'auto', maxWidth: '100%' }}>
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
