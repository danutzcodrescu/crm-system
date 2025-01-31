import Cancel from '@mui/icons-material/Cancel';
import CheckBox from '@mui/icons-material/CheckBox';
import Edit from '@mui/icons-material/Edit';
import LinkIcon from '@mui/icons-material/Link';
import { Box, Card, CardContent, IconButton, Link, Typography } from '@mui/material';
import type { FetcherWithComponents } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { Field } from '~/components/EditForm';
import { EditDialog } from '~/components/shared/EditDialog.client';
import { formatDate } from '~/utils/client/dates';

interface InitialConsultationCardProps {
  data: {
    id: string;
    documentSent: boolean;
    isSigned: boolean;
    dateSigned: Date | null;
    isShared: boolean;
    dateShared: Date | null;
    link: string | null;
  };
  fetcher: FetcherWithComponents<unknown>;
}

export function InitialConsultationCard({ data, fetcher }: InitialConsultationCardProps) {
  const [fields, setFields] = useState<Field[]>([]);

  useEffect(() => {
    if (fetcher.state === 'idle' && fields.length) {
      setFields([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        label: 'Document sent',
        name: 'documentSent',
        type: 'text',
        select: true,
        options: [
          { label: 'Yes', value: 'true' },
          { label: 'No', value: 'false' },
        ],
        defaultValue: data.documentSent,
      },
      {
        label: 'Date signed',
        name: 'dateSigned',
        type: 'date',
        defaultValue: data.dateSigned as unknown as string,
      },
      {
        label: 'Date shared with EPA',
        name: 'dateShared',
        type: 'date',
        defaultValue: data.dateShared as unknown as string,
      },
      {
        label: 'Link to signed document',
        name: 'link',
        type: 'text',
        defaultValue: data.link || undefined,
      },
    ]);
  };

  return (
    <Card>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Typography variant="h6" component="h2">
            Initial Consultation
          </Typography>
          <IconButton onClick={handleEdit} size="small">
            <Edit />
          </IconButton>
        </Box>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Has signed initial consultation document:</Typography>
            {data.isSigned ? (
              <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
            ) : (
              <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Initial Consultation document:</Typography>
            {data.link ? (
              <Link
                href={data.link}
                target="_blank"
                rel="noreferrer"
                sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
              >
                <LinkIcon /> View document
              </Link>
            ) : (
              <Typography variant="body2" color="text.secondary">
                N/A
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Date for signature:</Typography>
            <Typography variant="body2">
              {data.dateSigned ? formatDate(data.dateSigned as unknown as string) : 'N/A'}
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Initial Consultation Document shared with EPA:</Typography>
            {data.isShared ? (
              <CheckBox sx={{ color: (theme) => theme.palette.success.main }} />
            ) : (
              <Cancel sx={{ color: (theme) => theme.palette.error.main }} />
            )}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="body1">Date for sharing with EPA:</Typography>
            <Typography variant="body2">
              {data.dateShared ? formatDate(data.dateShared as unknown as string) : 'N/A'}
            </Typography>
          </Box>
        </Box>
      </CardContent>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title="Edit initial consultation"
            fetcher={fetcher}
            url="/initial-consultation"
          />
        )}
      </ClientOnly>
    </Card>
  );
}
