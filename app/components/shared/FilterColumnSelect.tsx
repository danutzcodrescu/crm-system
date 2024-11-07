import FilterAlt from '@mui/icons-material/FilterAlt';
import { Box, Chip, Menu, MenuItem, OutlinedInput, Select, SelectChangeEvent, Stack } from '@mui/material';
import { Column } from '@tanstack/react-table';
import { useCallback, useState } from 'react';

export function FilterColumnSelect<T>({ column }: { column: Column<T, unknown> }) {
  const [filterButton, setFilterButton] = useState<SVGAElement | null>(null);
  const columnFilterValue = column.getFilterValue() as string[];

  const handleClose = useCallback(() => {
    setFilterButton(null);
  }, []);

  const handleChange = (event: SelectChangeEvent<string>) => {
    const {
      target: { value },
    } = event;
    column.setFilterValue(value);
  };

  return (
    <Stack direction="row" gap={1} onClick={(e) => e.stopPropagation()}>
      <FilterAlt
        sx={{ cursor: 'pointer' }}
        onClick={(e) => {
          setFilterButton(e.target as SVGAElement);
        }}
      />
      <Menu
        id="basic-menu"
        anchorEl={filterButton}
        open={!!filterButton}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <Select
          multiple
          // @ts-expect-error mui type issue
          value={columnFilterValue || []}
          onChange={handleChange}
          displayEmpty
          input={<OutlinedInput />}
          sx={{ width: '15rem' }}
          renderValue={(selected) =>
            selected.length === 0 ? (
              'Status'
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as unknown as string[]).map((value) => (
                  <Chip
                    key={value}
                    label={value}
                    // onDelete={(e) => {
                    //   console.log('test');
                    //   e.stopPropagation();
                    //   column.setFilterValue((prev: string[]) => prev.filter((item) => item !== value));
                    // }}
                  />
                ))}
              </Box>
            )
          }
        >
          <MenuItem value="" disabled>
            Filter
          </MenuItem>
          {(column.columnDef.meta?.filterOptions || []).map((option) => (
            <MenuItem key={option} value={option} selected={columnFilterValue?.includes(option)}>
              {option}
            </MenuItem>
          ))}
        </Select>
      </Menu>
    </Stack>
  );
}
