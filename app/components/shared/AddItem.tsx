import { LoadingButton } from '@mui/lab';
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Stack, TextField } from '@mui/material';
import { Form, useNavigation } from '@remix-run/react';
import { ReactNode, useEffect, useState } from 'react';

import { Field } from '../EditForm';

interface RenderProps {
  onClick: () => void;
}

interface Props {
  renderAddButton: (decorators: RenderProps) => ReactNode;
  title: string;
  fields: Omit<Field, 'defaultValue'>[];
}

export function AddItem({ title, fields, renderAddButton }: Props) {
  const [isModalOpen, setModalState] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (navigation.state === 'idle' && isModalOpen) {
      setModalState(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation.state]);
  return (
    <>
      {renderAddButton({ onClick: () => setModalState(true) })}
      <Dialog maxWidth="xs" fullWidth open={isModalOpen} onClose={() => setModalState(false)}>
        <Form method="post">
          <DialogTitle>{title}</DialogTitle>
          <DialogContent>
            <Stack gap={1}>
              {fields.map((field) => (
                <TextField
                  key={field.name}
                  fullWidth
                  label={field.label}
                  name={field.name}
                  placeholder={field.placeholder}
                  type={field.type}
                  required={field.required}
                  size="small"
                  slotProps={{ htmlInput: field.inputProps }}
                ></TextField>
              ))}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setModalState(false)} color="secondary">
              Cancel
            </Button>
            <LoadingButton type="submit" color="primary" disabled={navigation.state !== 'idle'}>
              Create
            </LoadingButton>
          </DialogActions>
        </Form>
      </Dialog>
    </>
  );
}
