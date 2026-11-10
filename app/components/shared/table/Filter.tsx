import { ClientOnly } from 'remix-utils/client-only';

import { Column } from '~/utils/table';

import { FilterColumn } from './FilterColumn';
import { FilterColumnDatePicker } from './FilterColumnDatePicker.client';
import { FilterColumnSelect } from './FilterColumnSelect';

export function Filter<T extends object>({ column }: { column: Column<T, unknown> }) {
  if (column.columnDef?.meta?.filterOptions) {
    return <FilterColumnSelect column={column} />;
  }
  if (column.columnDef?.meta?.filterByDate) {
    return <ClientOnly>{() => <FilterColumnDatePicker column={column} />}</ClientOnly>;
  }
  return <FilterColumn column={column} />;
}
