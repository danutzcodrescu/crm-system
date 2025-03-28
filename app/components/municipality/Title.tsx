import EditIcon from '@mui/icons-material/Edit';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { Status } from '~/utils/server/repositories/status.server';
import { User } from '~/utils/server/repositories/users.server';

import { EditDialog } from '../shared/EditDialog.client';

interface Props {
  municipality: MunicipalityData;
  fetcher: FetcherWithComponents<unknown>;
  statusList: Status[];
  users: User[];
}

export function MunicipalityTitle({ municipality, fetcher, statusList, users }: Props) {
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const handleEdit = useCallback(() => {
    setEditableData([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: municipality.id,
        hidden: true,
      },
      {
        label: 'Name',
        name: 'name',
        type: 'text',
        defaultValue: municipality.name,
      },
      {
        label: 'Code',
        name: 'code',
        type: 'text',
        defaultValue: municipality.code,
      },
      {
        label: 'Email',
        name: 'email',
        type: 'email',
        defaultValue: municipality.email,
      },
      {
        label: 'Status',
        name: 'statusId',
        type: 'text',
        select: true,
        // @ts-expect-error it works for now TO DO: fix it
        options: statusList.map((status) => ({ label: status.name, value: status.id })),
        defaultValue: municipality.statusId,
      },
      {
        label: 'SUP responsible',
        name: 'responsibleId',
        type: 'text',
        select: true,
        // @ts-expect-error it works for now TO DO: fix it
        options: users.map((user) => ({ label: user.name, value: user.id })).concat({ label: 'None', value: 0 }),
        defaultValue: municipality.responsibleId,
      },
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [municipality]);

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}
        >
          {municipality.name} ({municipality.code}) <Chip color="primary" label={municipality.statusName} />
          <Box component="span" sx={{ fontSize: '0.75em', fontWeight: 'normal' }}>
            General email {municipality.email}
          </Box>
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {municipality.responsibleId ? (
            <Typography variant="body2" component="p">
              SUP responsible:{' '}
              <Box component="span" sx={{ fontWeight: 'bold' }}>
                {municipality.responsibleName}
              </Box>
            </Typography>
          ) : null}
          <Tooltip title="Edit municipality data">
            <IconButton onClick={handleEdit} color="primary" size="small">
              <EditIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit municipality ${municipality.name}`}
            fetcher={fetcher}
            url={`/api/municipalities/${municipality.id}`}
          />
        )}
      </ClientOnly>
    </>
  );
}
