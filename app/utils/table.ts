// TanStack v9's supported v8-compatibility adapter keeps table behavior stable
// while the application upgrades independently of a feature/state-model rewrite.
import type {
  CellContext as TableCellContext,
  CellData,
  FilterFn as TableFilterFn,
  RowData,
  TableFeatures,
} from '@tanstack/react-table';
import type { LegacyFeatures } from '@tanstack/react-table/legacy';

export type { ColumnFiltersState, ColumnSort, RowData } from '@tanstack/react-table';
export { flexRender } from '@tanstack/react-table';
export type {
  LegacyColumn as Column,
  LegacyColumnDef as ColumnDef,
  LegacyRow as Row,
  LegacyTable as Table,
} from '@tanstack/react-table/legacy';
export {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useLegacyTable as useReactTable,
} from '@tanstack/react-table/legacy';

export type FilterFn<TData extends RowData> = TableFilterFn<LegacyFeatures, TData>;
export type CellContext<TData extends RowData, TValue extends CellData = CellData> = TableCellContext<
  LegacyFeatures,
  TData,
  TValue
>;

declare module '@tanstack/react-table' {
  interface ColumnMeta<
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TFeatures extends TableFeatures,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    in out TData extends RowData,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TValue extends CellData = CellData,
  > {
    filterOptions?: { label: string; value: unknown }[];
    filterOptionsLabel?: string;
    filterByDate?: true;
    defaultHidden?: boolean;
  }

  interface FilterFns {
    // TanStack's global registry is shared by tables with different row types.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    boolean: FilterFn<any>;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dateRange: FilterFn<any>;
  }
}
