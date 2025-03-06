import { Box } from '@mui/material';
import { isToday } from 'date-fns';
import { extractNameFromHeader } from '~/utils/emails';
import { EmailMessage, getEmailsPerMunicipality, Thread } from '~/utils/server/services/gmail.server';

interface Props {
  data: NonNullable<Awaited<ReturnType<typeof getEmailsPerMunicipality>>[1]>;
  onClick: (thread: Thread) => void;
  email: string;
}

export function ThreadsList({ data, onClick, email }: Props) {
  return (
    <Box
      sx={{
        display: 'grid',
        justifyContent: 'space-between',
        gridTemplateColumns: 'max-content 1fr auto',
        width: '100%',
        alignItems: 'center',
        py: 1,
        fontSize: (theme) => theme.typography.body1.fontSize,
      }}
    >
      {data.map((thread) => (
        <Box
          key={thread.id}
          onClick={() => onClick(thread)}
          sx={{
            display: 'contents',

            cursor: 'pointer',
            '& > *': {
              py: 1,
            },
            '&:not(:first-of-type) > *': {
              borderTop: '1px solid',
              borderColor: 'divider',
            },
          }}
        >
          <Box component="span" sx={{ width: '100%' }}>
            {thread.headers.from.includes(email)
              ? extractNameFromHeader(thread.headers.to)
              : extractNameFromHeader(thread.headers.from)}
          </Box>
          <Box
            component="span"
            sx={{
              fontSize: (theme) => theme.typography.body2.fontSize,
              display: 'flex',
              gap: 1.5,
              alignItems: 'center',
              overflow: 'hidden',
              width: '100%',
              height: '100%',
              px: 1,
            }}
          >
            <Box sx={{ flexShrink: 0 }} component="span">
              {thread.headers.subject}
            </Box>

            <Box
              sx={{
                fontSize: '0.8em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                display: 'block',
                minWidth: 0,
                flex: '1 1 auto',
                lineHeight: '0.9',
              }}
              component="span"
            >
              {thread.snippet}
            </Box>
          </Box>
          <Box component="span" sx={{ flexShrink: 0 }}>
            {Intl.DateTimeFormat(
              'sv-SE',
              isToday(thread.headers.date)
                ? { hour: '2-digit', minute: '2-digit' }
                : { year: 'numeric', month: '2-digit', day: '2-digit' },
            ).format(new Date(thread.headers.date))}
          </Box>
        </Box>
      ))}
    </Box>
  );
}
