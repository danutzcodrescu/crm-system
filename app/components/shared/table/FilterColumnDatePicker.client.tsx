import FilterAlt from '@mui/icons-material/FilterAlt';
import { Popover, Stack, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { useEffect, useReducer } from 'react';

import { Column } from '~/utils/table';

interface State {
  filterButton: SVGAElement | null;
  startDate: Date | null;
  endDate: Date | null;
}

interface Props<T extends object> {
  column: Column<T, unknown>;
}

export function FilterColumnDatePicker<T extends object>({ column }: Props<T>) {
  const [state, setState] = useReducer((oldState: State, newState: Partial<State>) => ({ ...oldState, ...newState }), {
    filterButton: null,
    startDate: (column.getFilterValue() as undefined | [Date, Date])?.at(0) || null,
    endDate: (column.getFilterValue() as undefined | [Date, Date])?.at(1) || null,
  });

  useEffect(() => {
    if (state.startDate && state.endDate) {
      column.setFilterValue([state.startDate, state.endDate]);
    }

    if (!state.startDate && !state.endDate) {
      column.setFilterValue(undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.startDate, state.endDate]);

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
            setState({ filterButton: e.target as SVGAElement });
          }}
        />
      </Stack>
      <Popover
        open={!!state.filterButton}
        sx={{ '& .MuiPopover-paper': { p: 1 } }}
        onClose={() => setState({ filterButton: null })}
        anchorEl={state.filterButton}
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
          direction="row"
          sx={{
            gap: 1,
            alignContent: 'center',
          }}
        >
          <DatePicker
            label="Start date"
            defaultValue={state.startDate}
            onChange={(newValue) => setState({ startDate: newValue })}
            slotProps={{
              field: { clearable: true, onClear: () => setState({ startDate: null }) },
            }}
          />
          <span>-</span>
          <DatePicker
            label="End date"
            defaultValue={state.endDate}
            onChange={(newValue) => setState({ endDate: newValue })}
            slotProps={{
              field: { clearable: true, onClear: () => setState({ endDate: null }) },
            }}
          />
        </Stack>
      </Popover>
    </>
  );
}
