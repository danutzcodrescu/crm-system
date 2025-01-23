import { TZDate } from '@date-fns/tz';
import { Checkbox, FormControlLabel, MenuItem, Stack, TextField, TextFieldProps } from '@mui/material';
import { DatePicker, DateTimePicker } from '@mui/x-date-pickers';
import { FormProps } from '@remix-run/react';
import { cloneElement, Fragment, ReactNode, useRef, useState } from 'react';

export interface Field {
  name: string;
  type: Required<TextFieldProps>['type'];
  required?: TextFieldProps['required'];
  label?: TextFieldProps['label'];
  placeholder?: TextFieldProps['placeholder'];
  hidden?: TextFieldProps['hidden'];
  defaultValue?: string | number | boolean;
  multiline?: TextFieldProps['multiline'];
  maxRows?: TextFieldProps['maxRows'];
  inputProps?: {
    step?: string;
    min?: string;
    max?: string;
    pattern?: string;
  };
  condition?: [string, unknown];
  watchable?: boolean;
  select?: boolean;
  options?: { label: string; value: string }[];
  render?: () => ReactNode;
}

interface Props extends FormProps {
  fields: Field[];
}

export function EditForm({ fields }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [watchableFields, setWatchableFields] = useState<Record<string, unknown>>({});
  return (
    <Stack sx={{ gap: 2, width: '100%' }}>
      {fields.map((field) => {
        if (
          field.condition &&
          ((watchableFields[field.condition[0]] && watchableFields[field.condition[0]] !== field.condition[1]) ||
            (watchableFields[field.condition[0]] === undefined &&
              fields.find((f) => f.name === field.condition?.[0])?.defaultValue !== field.condition[1]))
        )
          return null;
        if (field.render)
          // @ts-expect-error passing a key is not an issue
          return cloneElement(field.render(), {
            key: field.name,
            label: field.label,
            defaultValue: field.defaultValue as string,
            name: field.name,
            required: !!field.required,
            ...(field.watchable
              ? {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setWatchableFields((prev) => ({ ...prev, [field.name]: e.target.value })),
                }
              : {}),
          });
        if (field.type === 'checkbox') {
          return (
            <Fragment key={field.name}>
              {/* make sure the checkbox is in sync */}
              <input type="hidden" name={field.name} defaultValue={field.defaultValue as string} ref={inputRef} />
              <FormControlLabel
                // name={field.name}
                control={
                  <Checkbox
                    defaultChecked={field.defaultValue as boolean}
                    onChange={(val) => {
                      // @ts-expect-error - we know that the inputRef is an input element
                      inputRef.current.value = val.target.checked;
                      if (field.watchable)
                        setWatchableFields((prev) => ({ ...prev, [field.name]: val.target.checked }));
                    }}
                    required={!!field.required}
                  />
                }
                label={field.label as string}
              />
            </Fragment>
          );
        }
        if (field.type === 'datetime') {
          return (
            <DateTimePicker
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
            required={!!field.required}
            multiline={!!field.multiline}
            maxRows={field.maxRows}
            select={!!field.select}
            {...(field.watchable
              ? {
                  onChange: (e: React.ChangeEvent<HTMLInputElement>) =>
                    setWatchableFields((prev) => ({ ...prev, [field.name]: e.target.value })),
                }
              : {})}
          >
            {field.select && field.options
              ? field.options.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))
              : null}
          </TextField>
        );
      })}
    </Stack>
  );
}
