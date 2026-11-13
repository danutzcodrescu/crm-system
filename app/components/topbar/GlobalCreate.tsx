import AddCircle from '@mui/icons-material/AddCircle';
import { Alert, AlertColor, IconButton, Link, Menu, MenuItem, Snackbar, Tooltip } from '@mui/material';
import { useCallback, useState } from 'react';
import { Link as RLink, useFetcher } from 'react-router';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';

import { EditDialog } from '../shared/EditDialog.client';

export function GlobalCreate() {
  const fetcher = useFetcher();
  const [dismissedResult, setDismissedResult] = useState<unknown>();
  const [municipalities, setMunicipalities] = useState<{ id: string; name: string; code: string }[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const { setEditableData, fields, setFields, onSubmit } = useEditFields(fetcher);
  const [municipalityId, setMunicipalityId] = useState<string | null>(null);
  const isAlertOpen =
    fetcher.state === 'idle' && typeof fetcher.data?.message === 'string' && fetcher.data !== dismissedResult;
  const dismissAlert = () => setDismissedResult(fetcher.data);

  // Retain the options when the same fetcher later holds a mutation result.
  if (Array.isArray(fetcher.data?.message) && municipalities !== fetcher.data.message) {
    setMunicipalities(fetcher.data.message);
  }

  const fetchData = useCallback(() => {
    if (!municipalities.length) {
      fetcher.submit({}, { method: 'GET', action: '/api/municipalities', relative: 'path' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipalities]);

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

  const submittedMunicipalityId = fetcher.formData?.get('companyId');
  if (typeof submittedMunicipalityId === 'string' && submittedMunicipalityId !== municipalityId) {
    setMunicipalityId(submittedMunicipalityId);
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
            onSubmit={onSubmit}
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
        onClose={dismissAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={fetcher?.data?.severity as AlertColor} onClose={dismissAlert}>
          {typeof fetcher.data?.message === 'string' ? fetcher.data.message : null}
          {fetcher.data?.severity === 'success' && municipalityId ? (
            <>
              . Click&nbsp;
              <Link component={RLink} prefetch="intent" to={`/municipalities/${municipalityId}`}>
                here
              </Link>{' '}
              to see more details.
            </>
          ) : null}
        </Alert>
      </Snackbar>
    </>
  );
}
