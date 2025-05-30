import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';
import { useIntersectionObserver } from '@react-hookz/web';
import { useFetcher, useParams } from '@remix-run/react';
import { useEffect, useRef, useState } from 'react';

import { EmailApiResponse, loader } from '~/api/emails/route';
import { Thread } from '~/utils/server/services/gmail.server';

import { ThreadsList } from './ThreadList';
import { ThreadViewer } from './ThreadViewer';

interface EmailCardProps {
  email: string;
}

export function EmailsCard({ email }: EmailCardProps) {
  const params = useParams();
  const [thread, setThread] = useState<Thread | null>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Ref for IntersectionObserver
  const fetcher = useFetcher<typeof loader>();
  const intersection = useIntersectionObserver(cardRef, {
    rootMargin: '500px 0px 300px 0px',
    threshold: [0.01], // Trigger if even a small part is within the margin
  });

  useEffect(() => {
    if (
      intersection?.isIntersecting &&
      (!fetcher.data || (fetcher?.data as EmailApiResponse)?.message?.municipalityId !== params.municipalityId)
    ) {
      fetcher.load(`/api/emails?municipalityId=${params.municipalityId}`);
      setThread(null); // Reset thread when loading new emails
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.companyId, intersection?.isIntersecting, fetcher.data]);

  return (
    <Card
      ref={cardRef} // Assign ref here
      sx={{ gridColumn: { xs: '1', lg: '1 / span 2', '2k': '1 / span 3', '2k-wide': '1 / span 4' } }}
    >
      <CardContent>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            mb: 2,
          }}
        >
          <Typography variant="h6" component="h2">
            Inbox {email ? `for ${email}` : ''}
          </Typography>
        </Box>
        {thread ? (
          <ThreadViewer thread={thread} email={email} onClose={() => setThread(null)} />
        ) : (
          <>
            {fetcher.state !== 'idle' ? (
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
                {[...Array(12)].map((_, index) => (
                  <Skeleton key={index} variant="text" width="100%" height={40} />
                ))}
              </Box>
            ) : null}

            {fetcher.state === 'idle' && (fetcher.data as EmailApiResponse)?.message?.emails?.length ? (
              <ThreadsList
                data={(fetcher?.data as EmailApiResponse).message.emails}
                onClick={(thread) => setThread(thread)}
                email={email}
              />
            ) : null}
            {fetcher.state === 'idle' &&
            (fetcher.data as EmailApiResponse)?.message?.emails?.length === 0 &&
            fetcher.state === 'idle' ? (
              <Typography>No emails found.</Typography>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
