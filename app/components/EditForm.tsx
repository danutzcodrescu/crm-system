import { TZDate } from '@date-fns/tz';
import { Checkbox, FormControlLabel, Stack, TextField, TextFieldProps } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { FormProps } from '@remix-run/react';
import { cloneElement, Fragment, ReactNode, useRef } from 'react';

export interface Field {
  name: string;
  type: Required<TextFieldProps>['type'];
  required?: TextFieldProps['required'];
  label?: TextFieldProps['label'];
  placeholder?: TextFieldProps['placeholder'];
  hidden?: TextFieldProps['hidden'];
  defaultValue?: string | number | boolean;
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
}

export function EditForm({ fields }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <Stack sx={{ gap: 2, width: '100%' }}>
      {fields.map((field) => {
        // @ts-expect-error passing a key is not an issue
        if (field.render) return cloneElement(field.render(), { key: field.name });
        if (field.type === 'checkbox') {
          return (
            <Fragment key={field.name}>
              <input type="hidden" name={field.name} defaultValue={field.defaultValue as string} ref={inputRef} />
              <FormControlLabel
                // name={field.name}
                control={
                  <Checkbox
                    defaultChecked={field.defaultValue as boolean}
                    // @ts-expect-error - we know that the inputRef is an input element
                    onChange={(val) => (inputRef.current.value = val.target.checked)}
                  />
                }
                label={field.label as string}
              />
            </Fragment>
          );
        }
        if (field.type === 'date') {
          return (
            <DatePicker
              key={field.name}
              label={field.label}
              name={field.name}
              defaultValue={
                (field.defaultValue as string) ? new TZDate(field.defaultValue as unknown as string) : undefined
              }
              sx={{ minWidth: 150 }}
            />
          );
        }
        return (
          <TextField
            size="small"
            fullWidth
            sx={{ display: field.hidden ? 'none' : 'block' }}
            key={field.name}
            name={field.name}
            type={field.type}
            defaultValue={field.defaultValue}
            placeholder={field.placeholder}
            slotProps={{ htmlInput: field.inputProps }}
            label={field.label}
            hidden={!!field.hidden}
          />
        );
      })}
    </Stack>
  );
}
