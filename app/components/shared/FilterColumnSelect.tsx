import FilterAlt from '@mui/icons-material/FilterAlt';
import {
  Box,
  Checkbox,
  Chip,
  ListItemText,
  Menu,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Stack,
} from '@mui/material';
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
    if (value.length && typeof value[0] === 'boolean') {
      if (value.length === 2) {
        column.setFilterValue([]);
      } else {
        column.setFilterValue((value as unknown as boolean[]).map((item) => !item));
      }
    } else {
      column.setFilterValue(value);
    }
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
        anchorEl={filterButton}
        open={!!filterButton}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        sx={{
          '& .MuiList-padding': {
            paddingTop: 0.5,
            paddingBottom: 0.5,
            paddingInline: 0.5,
          },
        }}
      >
        <Select
          multiple
          // @ts-expect-error mui type issue
          value={columnFilterValue || []}
          onChange={handleChange}
          displayEmpty
          input={<OutlinedInput />}
          sx={{ width: '15rem', '& .MuiSelect-multiple': { padding: 1 } }}
          renderValue={(selected) => {
            return selected.length === 0 ||
              selected.length === (column?.columnDef?.meta?.filterOptions as unknown[]).length ? (
              column?.columnDef?.meta?.filterOptionsLabel
            ) : (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {(selected as unknown as string[]).map((value) => (
                  <Chip
                    key={value as string}
                    label={column.columnDef.meta?.filterOptions?.find((option) => option.value === value)?.label}
                    // onDelete={(e) => {
                    //   console.log('test');
                    //   e.stopPropagation();
                    //   column.setFilterValue((prev: string[]) => prev.filter((item) => item !== value));
                    // }}
                  />
                ))}
              </Box>
            );
          }}
        >
          <MenuItem value="" disabled>
            Filter
          </MenuItem>
          {(column.columnDef.meta?.filterOptions || []).map((option) => (
            <MenuItem key={option.value as string} value={option.value as string}>
              <Checkbox
                checked={
                  !columnFilterValue ||
                  columnFilterValue?.length === 0 ||
                  columnFilterValue?.includes(option.value as string)
                }
              />
              <ListItemText primary={option.label} />
            </MenuItem>
          ))}
        </Select>
      </Menu>
    </Stack>
  );
}
