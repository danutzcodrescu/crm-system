import EditIcon from '@mui/icons-material/Edit';
import { Box, Chip, IconButton, Tooltip, Typography } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { useCallback } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { useEditFields } from '~/hooks/editFields';
import { MunicipalityData } from '~/utils/server/repositories/municipalities.server';
import { User } from '~/utils/server/repositories/users.server';

import { EditDialog } from '../shared/EditDialog.client';

interface Props {
  municipality: MunicipalityData;
  fetcher: FetcherWithComponents<unknown>;
  users: User[];
}

export function MunicipalityTitle({ municipality, fetcher, users }: Props) {
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
        label: 'Manual Consultation',
        name: 'manualConsultation',
        type: 'text',
        select: true,
        defaultValue: municipality.manualConsultation,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'Blank', value: '' },
        ],
      },
      {
        label: 'Declines Agreement',
        name: 'declinedAgreement',
        type: 'text',
        select: true,
        defaultValue: municipality.declinedAgreement,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'Blank', value: '' },
        ],
      },
      {
        label: 'Wave',
        name: 'workingCategory',
        type: 'text',
        select: true,
        defaultValue: municipality.workingCategory?.toLowerCase(),
        watchable: true,
        options: [
          { label: 'Wave 1', value: 'wave 1' },
          { label: 'Wave 2', value: 'wave 2' },
          { label: 'Wave 3', value: 'wave 3' },
        ],
      },
      {
        label: 'Wave under group',
        name: 'wave',
        type: 'text',
        select: true,
        defaultValue: municipality.wave,
        condition: ['workingCategory', 'wave 2'],
        options: [
          { label: 'A', value: 'A' },
          { label: 'B', value: 'B' },
          { label: 'C', value: 'C' },
          { label: 'D', value: 'D' },
          { label: 'E', value: 'E' },
          { label: 'F', value: 'F' },
          { label: 'G', value: 'G' },
          { label: 'H', value: 'H' },
          { label: 'Z', value: 'Z' },
        ],
      },
      {
        label: 'Wave under group',
        name: 'wave',
        type: 'text',
        select: true,
        defaultValue: municipality.wave,
        condition: ['workingCategory', 'wave 3'],
        options: [
          { label: 'X', value: 'X' },
          { label: 'Blank', value: '' },
        ],
      },
      {
        label: 'Wave under group',
        name: 'wave',
        type: 'text',
        defaultValue: '',
        condition: ['workingCategory', 'wave 1'],
        hidden: true,
      },
      {
        label: 'SUP responsible',
        name: 'responsibleId',
        type: 'text',
        select: true,
        // @ts-expect-error it works for now TO DO: fix it
        options: users.map((user) => ({ label: user.name, value: user.id })).concat({ label: 'None', value: 0 }),
        defaultValue: municipality.responsibleId || 0,
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
          {municipality.name} <Chip color="primary" label={municipality.computedStatus} />
          <Box component="span" sx={{ fontSize: '0.75em', fontWeight: 'normal' }}>
            {municipality.workingCategory}
            {municipality.wave ? `, ${municipality.wave}` : ''}
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
            method="PATCH"
            url={`/api/municipalities/${municipality.id}`}
          />
        )}
      </ClientOnly>
    </>
  );
}
