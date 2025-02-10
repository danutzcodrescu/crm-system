import AddLink from '@mui/icons-material/AddLink';
import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import Edit from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Link,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { FetcherWithComponents } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { Field } from '~/components/EditForm';
import { EditDialog } from '~/components/shared/EditDialog.client';
import { formatDate } from '~/utils/client/dates';
import { MunicipalityAgreementData } from '~/utils/server/repositories/agreement.server';

interface AgreementCardProps {
  data: MunicipalityAgreementData;
  fetcher: FetcherWithComponents<unknown>;
}

export function AgreementCard({ data, fetcher }: AgreementCardProps) {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fields.length) {
      setFields([]);
    }
  }, [fetcher.state]);

  const handleEdit = () => {
    setFields([
      {
        label: 'id',
        name: 'id',
        type: 'text',
        defaultValue: data.id,
        hidden: true,
      },
      {
        label: 'Type of agreement',
        name: 'typeOfAgreement',
        type: 'text',
        select: true,
        defaultValue: data.oldAgreementDateSigned ? 'old' : 'new',
        watchable: true,
        options: [
          { label: 'New agreement', value: 'new' },
          { label: 'Old agreement', value: 'old' },
        ],
      },
      {
        label: 'Old agreement sent',
        name: 'oldAgreementSent',
        type: 'text',
        select: true,
        defaultValue: 'false',
        condition: ['typeOfAgreement', 'old'],
        options: [
          { label: 'Sent', value: 'true' },
          { label: 'Not sent', value: 'false' },
        ],
      },
      {
        label: 'Old agreement signed',
        name: 'oldAgreementSigned',
        type: 'date',
        defaultValue: data.oldAgreementDateSigned as unknown as string,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Old agreement shared with EPA',
        name: 'oldAgreementShared',
        type: 'date',
        defaultValue: data.oldAgreementDateShared as unknown as string,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Link to signed document',
        name: 'oldAgreementLink',
        type: 'link',
        defaultValue: data.oldAgreementLink || undefined,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'Link to appendix',
        name: 'oldAgreementAppendix',
        type: 'link',
        defaultValue: data.oldAgreementAppendix || undefined,
        condition: ['typeOfAgreement', 'old'],
      },
      {
        label: 'New agreement sent',
        name: 'newAgreementSent',
        type: 'text',
        select: true,
        defaultValue: 'false',
        condition: ['typeOfAgreement', 'new'],
        options: [
          { label: 'Sent', value: 'true' },
          { label: 'Not sent', value: 'false' },
        ],
      },
      {
        label: 'New agreement signed',
        name: 'newAgreementSigned',
        type: 'date',
        defaultValue: data.newAgreementDateSigned as unknown as string,
        condition: ['typeOfAgreement', 'new'],
      },
      {
        label: 'New agreement shared with EPA',
        name: 'newAgreementShared',
        type: 'date',
        defaultValue: data.newAgreementDateShared as unknown as string,
        condition: ['typeOfAgreement', 'new'],
      },
      {
        label: 'Link to signed document',
        name: 'newAgreementLink',
        type: 'link',
        defaultValue: data.newAgreementLink || undefined,
        condition: ['typeOfAgreement', 'new'],
      },
    ]);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Agreement
          </Typography>
          <IconButton onClick={handleEdit} size="small">
            <Edit />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Agreement signed:</Typography>
            {data.oldAgreementDateSigned || data.newAgreementDateSigned ? (
              <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
            ) : (
              <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
            )}
          </Box>

          <Table>
            <TableHead>
              <TableRow>
                <TableCell></TableCell>
                <TableCell>Old agreement</TableCell>
                <TableCell>New agreement</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              <TableRow>
                <TableCell>Agreement link</TableCell>
                <TableCell>
                  {data.oldAgreementLink ? (
                    <Stack direction="row" alignItems="center" gap={0.5}>
                      <Link
                        href={data.oldAgreementLink}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <LinkIcon /> View document
                      </Link>
                      <Link
                        href={data.oldAgreementAppendix as string}
                        target="_blank"
                        rel="noreferrer"
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        <AddLink /> View appendix
                      </Link>
                    </Stack>
                  ) : data.newAgreementLink ? (
                    <Link
                      href={data.newAgreementLink}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <LinkIcon /> View document
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
                <TableCell>
                  {data.newAgreementLink ? (
                    <Link
                      href={data.newAgreementLink}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                    >
                      <LinkIcon /> View document
                    </Link>
                  ) : (
                    'N/A'
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Date of signing</TableCell>
                <TableCell>
                  {data.oldAgreementDateSigned ? formatDate(data.oldAgreementDateSigned as unknown as string) : 'N/A'}
                </TableCell>
                <TableCell>
                  {data.newAgreementDateSigned ? formatDate(data.newAgreementDateSigned as unknown as string) : 'N/A'}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Agreement shared with EPA</TableCell>
                <TableCell>
                  {data.oldAgreementShared ? (
                    <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
                  ) : (
                    <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
                  )}
                </TableCell>
                <TableCell>
                  {data.newAgreementShared ? (
                    <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
                  ) : (
                    <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
                  )}
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell>Date for sharing with EPA</TableCell>
                <TableCell>
                  {data.oldAgreementDateShared ? formatDate(data.oldAgreementDateShared as unknown as string) : 'N/A'}
                </TableCell>
                <TableCell>
                  {data.newAgreementDateShared ? formatDate(data.newAgreementDateShared as unknown as string) : 'N/A'}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>
      </CardContent>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title="Edit agreement"
            fetcher={fetcher}
            url="/agreement"
          />
        )}
      </ClientOnly>
    </Card>
  );
}
