import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { Fragment, ReactNode } from 'react';
import { FetcherWithComponents } from 'react-router';

import { useSubmissionState } from '~/hooks/submissionState';

import { Field } from '../EditForm';

interface RenderProps {
  onClick: () => void;
}

interface Props {
  renderAddButton: (decorators: RenderProps) => ReactNode;
  title: string;
  fields: Omit<Field, 'defaultValue'>[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetcher: FetcherWithComponents<any>;
}

export function AddItem({ title, fields, renderAddButton, fetcher }: Props) {
  const [isModalOpen, setModalState] = useSubmissionState(fetcher, false);
  return (
    <>
      {renderAddButton({ onClick: () => setModalState(true) })}
      <Dialog maxWidth="xs" fullWidth open={isModalOpen} onClose={() => setModalState(false)}>
        <fetcher.Form method="post">
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <Stack
              sx={{
                gap: 1,
              }}
            >
              {fields.map((field) =>
                field.render ? (
                  <Fragment key={field.name}>{field.render()}</Fragment>
                ) : (
                  <TextField
                    size="small"
                    fullWidth
                    sx={{ flex: 1, display: field.hidden ? 'none' : 'block' }}
                    key={field.name}
                    name={field.name}
                    type={field.type}
                    hidden={field.hidden}
                    label={field.label}
                    required={field.required}
                    placeholder={field.placeholder}
                    slotProps={{ htmlInput: field.inputProps }}
                  />
                ),
              )}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalState(false)} color="secondary">
              Cancel
            </Button>
            <Button
              type="submit"
              color="primary"
              disabled={fetcher.state !== 'idle'}
              loading={fetcher.state !== 'idle'}
            >
              Create
            </Button>
          </DialogActions>
        </fetcher.Form>
      </Dialog>
    </>
  );
}
