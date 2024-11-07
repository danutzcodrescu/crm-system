import { FilterAlt } from '@mui/icons-material';
import { Collapse, Input, Stack } from '@mui/material';
import { useDebouncedCallback } from '@react-hookz/web';
import { Column } from '@tanstack/react-table';
import { ChangeEvent, useState } from 'react';

export function FilterColumn<T>({ column }: { column: Column<T, unknown> }) {
  const [isSearchFieldVisible, setIsSearchFieldVisible] = useState(false);
  const columnFilterValue = column.getFilterValue();
  const setFilter = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      column.setFilterValue(e.target.value);
    },
    [],
    400,
  );

  return (
    <Stack direction="row" gap={1} onClick={(e) => e.stopPropagation()}>
      <Collapse orientation="horizontal" in={isSearchFieldVisible} unmountOnExit>
        <Input
          defaultValue={columnFilterValue}
          placeholder={`Filter by ${column.columnDef.header}`}
          onChange={setFilter}
          onKeyUp={(e) => {
            if (e.code == 'Escape') {
              setIsSearchFieldVisible(false);
              column.setFilterValue('');
            }
            if (e.code == 'Enter') {
              setIsSearchFieldVisible(false);
            }
          }}
        />
      </Collapse>
      <FilterAlt
        sx={{ cursor: 'pointer' }}
        onClick={() => {
          setIsSearchFieldVisible(!isSearchFieldVisible);
        }}
      />
    </Stack>
  );
}
