import { ColumnFiltersState, Row } from '@tanstack/react-table';
import { useCallback, useState } from 'react';

const defaultFilterList = [
  { label: 'Blank', value: '' },
  { label: 'A', value: 'A' },
  { label: 'B', value: 'B' },
  { label: 'C', value: 'C' },
  { label: 'D', value: 'D' },
  { label: 'E', value: 'E' },
  { label: 'F', value: 'F' },
  { label: 'G', value: 'G' },
  { label: 'H', value: 'H' },
  { label: 'Z', value: 'Z' },
  { label: 'X', value: 'X' },
  { label: 'X1', value: 'X1' },
  { label: 'X2', value: 'X2' },
  { label: 'X3', value: 'X3' },
];

export function useWorkingWaveFiltering() {
  const [waveFilterList, setWaveFilterList] = useState<{ label: string; value: string }[]>(defaultFilterList);

  const filterItems = useCallback(
    (filters: ColumnFiltersState) => {
      const workingCategoryFilter = filters.find((filter) => filter.id === 'workingCategory');
      if (workingCategoryFilter) {
        const filterList = [{ label: 'Blank', value: '' }] as { label: string; value: string }[];
        if ((workingCategoryFilter.value as string[]).includes('Wave 2')) {
          filterList.push(
            ...[
              { label: 'A', value: 'A' },
              { label: 'B', value: 'B' },
              { label: 'C', value: 'C' },
              { label: 'D', value: 'D' },
              { label: 'E', value: 'E' },
              { label: 'F', value: 'F' },
              { label: 'G', value: 'G' },
              { label: 'H', value: 'H' },
              { label: 'Z', value: 'Z' },
            ],
          );
        }
        if ((workingCategoryFilter.value as string[]).includes('Wave 3')) {
          filterList.push(
            ...[
              { label: 'X', value: 'X' },
              { label: 'X1', value: 'X1' },
              { label: 'X2', value: 'X2' },
              { label: 'X3', value: 'X3' },
            ],
          );
        }
        setWaveFilterList(filterList);
      } else if (!workingCategoryFilter && waveFilterList.length !== defaultFilterList.length) {
        setWaveFilterList(defaultFilterList);
      }
    },
    [waveFilterList.length],
  );

  return { waveFilterList, filterItems };
}

export function filterWaveUnderCategory<T>(row: Row<T>, columnId: string, filterValue: string[]) {
  if (filterValue.length === 0) return true;
  // @ts-expect-error it works , type is not correct
  const value = row.original[columnId] as string;
  if (filterValue.includes('')) {
    // @ts-expect-error it is for blank values
    filterValue = filterValue.map((item) => {
      if (item === '') {
        return null;
      }
      return item;
    });
  }
  return filterValue.includes(value);
}
