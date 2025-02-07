import FilterAlt from '@mui/icons-material/FilterAlt';
import { Input, Popover, Stack, Typography } from '@mui/material';
import { useDebouncedCallback } from '@react-hookz/web';
import { Column } from '@tanstack/react-table';
import { ChangeEvent, useState } from 'react';

export function FilterColumn<T>({ column }: { column: Column<T, unknown> }) {
  const [filterButton, setFilterButton] = useState<SVGSVGElement | null>(null);
  const columnFilterValue = column.getFilterValue();
  const setFilter = useDebouncedCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      column.setFilterValue(e.target.value);
    },
    [],
    400,
  );

  return (
    <>
      <Stack direction="row" gap={1} onClick={(e) => e.stopPropagation()}>
        <FilterAlt
          sx={{ cursor: 'pointer' }}
          onClick={(e) => {
            setFilterButton(e.currentTarget);
          }}
        />
      </Stack>
      <Popover
        open={!!filterButton}
        sx={{ '& .MuiPopover-paper': { p: 1 } }}
        onClose={() => setFilterButton(null)}
        anchorEl={filterButton}
      >
        <Typography component="p" fontWeight="bold" gutterBottom>
          Filter by {column.columnDef.header as string}
        </Typography>
        <Input
          defaultValue={columnFilterValue}
          placeholder={`Filter by ${column.columnDef.header}`}
          onChange={setFilter}
          onKeyUp={(e) => {
            if (e.code == 'Escape') {
              setFilterButton(null);
              column.setFilterValue('');
            }
            if (e.code == 'Enter') {
              setFilterButton(null);
            }
          }}
        />
      </Popover>
    </>
  );
}
