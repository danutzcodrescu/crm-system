import { LoadingButton } from '@mui/lab';
import { Box, Button, Stack, TextField, TextFieldProps } from '@mui/material';
import { useKeyboardEvent } from '@react-hookz/web';
import { Form, FormProps, useNavigation } from '@remix-run/react';
import { cloneElement, ReactNode } from 'react';

export interface Field {
  name: string;
  type: Required<TextFieldProps>['type'];
  required?: TextFieldProps['required'];
  label?: TextFieldProps['label'];
  placeholder?: TextFieldProps['placeholder'];
  hidden?: TextFieldProps['hidden'];
  defaultValue: string | number;
  inputProps?: {
    step?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
  render?: () => ReactNode;
}

interface Props extends FormProps {
  fields: Field[];
  onCancel: () => void;
}

export function EditForm({ fields, onCancel, method }: Props) {
  const navigation = useNavigation();
  useKeyboardEvent('Escape', onCancel, [], { eventOptions: { passive: true } });

  return (
    <Stack direction="row" alignItems="center" sx={{ gap: 1, width: '100%' }} component={Form} method={method}>
      {fields.map((field) =>
        field.render ? (
          // @ts-expect-error passing a key is not an issue
          cloneElement(field.render(), { key: field.name })
        ) : (
          <TextField
            size="small"
            fullWidth
            sx={{ flex: 1, display: field.hidden ? 'none' : 'block' }}
            key={field.name}
            name={field.name}
            type={field.type}
            defaultValue={field.defaultValue}
            hidden={field.hidden}
            placeholder={field.placeholder}
            slotProps={{ htmlInput: field.inputProps }}
            label={field.label}
          />
        ),
      )}
      <Box>
        <Button color="secondary" onClick={onCancel}>
          Close
        </Button>
        <LoadingButton
          color="primary"
          type="submit"
          disabled={navigation.state === 'submitting'}
          loading={navigation.state !== 'idle'}
        >
          Save
        </LoadingButton>
      </Box>
    </Stack>
  );
}
