import { Column } from '@tanstack/react-table';

import { FilterColumn } from './FilterColumn';
import { FilterColumnSelect } from './FilterColumnSelect';

export function Filter<T>({ column }: { column: Column<T, unknown> }) {
  if (column.columnDef?.meta?.filterOptions) {
    return <FilterColumnSelect column={column} />;
  }
  return <FilterColumn column={column} />;
}
