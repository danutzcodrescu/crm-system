import AddCircle from '@mui/icons-material/AddCircle';
import { Alert, AlertColor, IconButton, Link, Menu, MenuItem, Snackbar, Tooltip } from '@mui/material';
import { Link as RLink, useFetcher } from '@remix-run/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';

import { EditDialog } from '../shared/EditDialog.client';

export function GlobalCreate() {
  const fetcher = useFetcher();
  const [isAlertOpen, setAlertStatus] = useState(false);
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string; code: string }[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { setEditableData, fields, setFields } = useEditFields(fetcher);
  const municipalityId = useRef<string | null>(null);

  const fetchData = useCallback(() => {
    if (!municipalities.length) {
      fetcher.submit({}, { method: 'GET', action: '/api/municipalities', relative: 'path' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalities]);

  useEffect(() => {
    // @ts-expect-error it works
    if (!municipalities.length && fetcher.data?.message && Array.isArray(fetcher.data.message)) {
      // @ts-expect-error it works
      setMunicipalities(fetcher.data.message);
      // @ts-expect-error it works
    } else if (fetcher?.data?.message && typeof fetcher.data?.message === 'string') {
      setAlertStatus(true);
      setEditableData([]);
    }
    // @ts-expect-error it works
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher?.data?.message, municipalities]);

  const setNewLogFields = useCallback(() => {
    setEditableData([
      {
        label: 'Municipality',
        name: 'companyId',
        type: 'text',
        select: true,
        options: municipalities.map((company) => ({
          label: `${company.name} (${company.code})`,
          value: company.id,
        })),
        required: true,
      },
      {
        label: 'Date',
        name: 'date',
        type: 'date',
        required: true,
        defaultValue: new Date() as unknown as string,
      },
      {
        label: 'Description',
        name: 'description',
        type: 'text',
        required: true,
        multiline: true,
      },
      {
        label: 'Reminder due date',
        name: 'reminderDueDate',
        type: 'date',
      },
      {
        label: 'Reminder description',
        name: 'reminderDescription',
        type: 'text',
        multiline: true,
      },
    ]);
    setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalities]);

  const setNewResponsibleFields = useCallback(() => {
    setEditableData([
      {
        label: 'Municipality',
        name: 'companyId',
        type: 'text',
        select: true,
        options: municipalities.map((company) => ({
          label: `${company.name} (${company.code})`,
          value: company.id,
        })),
        required: true,
      },
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        required: true,
      },
      {
        label: 'Title',
        name: 'title',
        type: 'text',
      },
      {
        label: 'Email',
        name: 'email',
        type: 'email',
      },
      {
        label: 'Phone',
        name: 'phoneNumber',
        type: 'tel',
      },
    ]);
    setAnchorEl(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalities]);

  if (fetcher?.formData?.get('companyId')) {
    municipalityId.current = fetcher.formData.get('companyId') as string;
  }
  return (
    <>
      <Tooltip title="Create new">
        <IconButton onClick={(e) => setAnchorEl(e.currentTarget)} color="inherit">
          <AddCircle />
        </IconButton>
      </Tooltip>
      <Menu
        anchorEl={anchorEl}
        open={!!anchorEl}
        onClose={() => setAnchorEl(null)}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onMouseOver={fetchData} onClick={setNewLogFields}>
          New log
        </MenuItem>
        <MenuItem onMouseOver={fetchData} onClick={setNewResponsibleFields}>
          New responsible
        </MenuItem>
      </Menu>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={fields?.[1]?.name === 'date' ? 'Add log' : 'Add responsible'}
            fetcher={fetcher}
            method="POST"
            url={fields?.[1]?.name === 'date' ? `/api/logs` : `/api/responsibles`}
          />
        )}
      </ClientOnly>
      <Snackbar
        open={isAlertOpen}
        autoHideDuration={5000}
        onClose={() => setAlertStatus(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {/* @ts-expect-error type issue */}
        <Alert severity={fetcher?.data?.severity as AlertColor} onClose={() => setAlertStatus(false)}>
          {/* @ts-expect-error type issue */}
          {fetcher?.data?.message}. Click&nbsp;
          <Link component={RLink} prefetch="intent" to={`/municipalities/${municipalityId.current}`}>
            here
          </Link>{' '}
          to see more details.
        </Alert>
      </Snackbar>
    </>
  );
}
