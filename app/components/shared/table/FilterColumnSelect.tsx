import FilterAlt from '@mui/icons-material/FilterAlt';
import { Checkbox, FormControlLabel, Popover, Stack, Typography } from '@mui/material';
import { useCallback, useState } from 'react';

import { Column } from '~/utils/table';

export function FilterColumnSelect<T extends object>({ column }: { column: Column<T, unknown> }) {
  const [filterButton, setFilterButton] = useState<SVGAElement | null>(null);
  const columnFilterValue = column.getFilterValue() as unknown[];

  const handleClose = useCallback(() => {
    setFilterButton(null);
  }, []);

  const handleChange = (value: unknown, checked: boolean) => {
    if (checked) {
      column.setFilterValue([...(Array.isArray(columnFilterValue) ? (columnFilterValue as unknown[]) : []), value]);
    } else {
      const newFilterValue = columnFilterValue?.filter((v) => v !== value);
      column.setFilterValue(newFilterValue.length ? newFilterValue : undefined);
    }
  };

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
            setFilterButton(e.target as SVGAElement);
          }}
        />
      </Stack>
      <Popover
        open={!!filterButton}
        sx={{ '& .MuiPopover-paper': { p: 1 } }}
        onClose={handleClose}
        anchorEl={filterButton}
      >
        <Typography
          component="p"
          gutterBottom
          sx={{
            fontWeight: 'bold',
          }}
        >
          Filter by {column.columnDef.meta?.filterOptionsLabel}
        </Typography>
        <Stack
          direction="column"
          sx={{
            gap: 1,
          }}
        >
          {column.columnDef.meta?.filterOptions?.map((option, index) => (
            <FormControlLabel
              key={(option.value as string | number | boolean).toString() + index}
              label={option.label}
              control={
                <Checkbox
                  checked={!!columnFilterValue?.includes(option.value)}
                  onChange={(_, checked) => {
                    handleChange(option.value, checked);
                  }}
                />
              }
            />
          ))}
        </Stack>
      </Popover>
    </>
  );
}
