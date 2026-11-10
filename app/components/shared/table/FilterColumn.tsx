import FilterAlt from '@mui/icons-material/FilterAlt';
import { Input, Popover, Stack, Typography } from '@mui/material';
import { useDebouncedCallback } from '@react-hookz/web';
import { ChangeEvent, useState } from 'react';

import { Column } from '~/utils/table';

export function FilterColumn<T extends object>({ column }: { column: Column<T, unknown> }) {
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
      <Stack
        direction="row"
        onClick={(e) => e.stopPropagation()}
        sx={{
          gap: 1,
        }}
      >
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
        <Typography
          component="p"
          gutterBottom
          sx={{
            fontWeight: 'bold',
          }}
        >
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
