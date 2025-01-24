import { TZDate } from '@date-fns/tz';
import { FilterFn, Row } from '@tanstack/react-table';
import { isAfter, isBefore } from 'date-fns';

type TData = Record<string, unknown> & { id: string };

export const booleanFilterFn: FilterFn<TData> = (row: Row<TData>, columnId: string, filterValue: boolean[]) => {
  if (filterValue.length === 0) return true;
  const value = row.original[columnId] as boolean;
  return filterValue.includes(value);
};

export const dateFilterFn: FilterFn<TData> = (row: Row<TData>, columnId: string, filterValue: [Date, Date] | []) => {
  if (filterValue.length === 0) return true;
  const value = row.original[columnId];
  if (!value) return false;

  return (
    isAfter(new TZDate(value as Date), new TZDate(filterValue[0])) &&
    isBefore(new TZDate(value as Date), new TZDate(filterValue[1]))
  );
};
