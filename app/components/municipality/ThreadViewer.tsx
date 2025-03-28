import { Box, Typography, Divider, Paper, IconButton, Stack, Tooltip } from '@mui/material';
import { isToday } from 'date-fns';
import { EmailMessage, Thread } from '~/utils/server/services/gmail.server';
import { base64ToBlob, extractNameFromHeader, extractEmailFromHeader } from '~/utils/emails';
import BackIcon from '@mui/icons-material/ArrowBack';
import ArticleIcon from '@mui/icons-material/Article';

interface ThreadViewerProps {
  thread: Thread;
  email: string;
  onClose: () => void;
}

export function ThreadViewer({ thread, onClose, email }: ThreadViewerProps) {
  return (
    <Box sx={{ width: '100%' }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" gap={3}>
        <Typography variant="h6" component="h2" sx={{ mb: 2 }}>
          {thread.headers.subject}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          <Tooltip title="Back to threads list">
            <IconButton size="small" onClick={onClose}>
              <BackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Stack>

      <Stack sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', width: '100%', rowGap: 2 }}>
        {thread.emails.map((emailItem) => (
          <Paper
            key={emailItem.id}
            elevation={1}
            sx={{
              mb: 2,
              p: 2,
              gridColumn: extractEmailFromHeader(emailItem.headers.from) === email ? '2 / span 5' : '1 / span 5',
              '&:hover': {
                boxShadow: 3,
              },
            }}
          >
            <Stack gap={2} direction="row" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {extractNameFromHeader(emailItem.headers.from)}
              </Typography>

              <Typography variant="body2" fontStyle="italic">
                {Intl.DateTimeFormat(
                  'sv-SE',
                  isToday(emailItem.headers.date)
                    ? { hour: '2-digit', minute: '2-digit', second: '2-digit' }
                    : { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' },
                ).format(new Date(emailItem.headers.date))}
              </Typography>
            </Stack>

            <Box>
              <Box
                sx={{
                  mt: 1,
                  '& a': { color: 'primary.main' },
                  '& img': { maxWidth: '100%', height: 'auto' },
                }}
                dangerouslySetInnerHTML={{ __html: emailItem.content }}
              />
            </Box>
            {emailItem.attachments?.length ? (
              <>
                <Divider />
                <Stack gap={2} direction="row" alignItems="center">
                  {emailItem.attachments.map((attachment) => (
                    <Stack gap={1} direction={'row'} alignItems="center">
                      <Typography variant="body2">{attachment.filename}</Typography>
                      <IconButton
                        title={attachment.filename}
                        key={attachment.filename + attachment.mimeType}
                        href={`/api/emails/${emailItem.id}/attachments/${attachment.data}?filename=${attachment.filename}&mimeType=${attachment.mimeType}`}
                        target="_blank"
                      >
                        <ArticleIcon />
                      </IconButton>
                    </Stack>
                  ))}
                </Stack>
              </>
            ) : null}
          </Paper>
        ))}
      </Stack>
    </Box>
  );
}
