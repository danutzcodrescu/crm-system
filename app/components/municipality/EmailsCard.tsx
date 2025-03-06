import { Box, Card, CardContent, Skeleton, Typography } from '@mui/material';

import { isToday } from 'date-fns';

import { EmailMessage, getEmailsPerMunicipality, gmail, Thread } from '~/utils/server/services/gmail.server';
import { ThreadsList } from './ThreadList';
import { Suspense, useEffect, useRef, useState } from 'react';
import { ThreadViewer } from './ThreadViewer';
import { Await, useFetcher, useParams } from '@remix-run/react';
import { useIntersectionObserver } from '@react-hookz/web';
import { loader } from '~/api/emails/route';

interface EmailCardProps {
  email: string;
}

export function EmailsCard({ email }: EmailCardProps) {
  const params = useParams();
  const [thread, setThread] = useState<Thread | null>(null);
  const cardRef = useRef<HTMLDivElement>(null); // Ref for IntersectionObserver
  const fetcher = useFetcher<typeof loader>();
  const intersection = useIntersectionObserver(cardRef, {
    root: null, // relative to the viewport
    rootMargin: '0px 0px 300px 0px', // 300px margin below the viewport (triggers earlier)
    threshold: [0.01], // Trigger if even a small part is within the margin
  });

  // Effect for Intersection Observer
  useEffect(() => {
    if (intersection?.isIntersecting) {
      fetcher.load(`/api/emails?municipalityId=${params.municipalityId}`);
    }
  }, [params.companyId, intersection?.isIntersecting]);

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

            {fetcher.data?.message?.length ? (
              <ThreadsList
                data={fetcher.data.message as Thread[]}
                onClick={(thread) => setThread(thread)}
                email={email}
              />
            ) : null}
            {fetcher.data?.message?.length === 0 && fetcher.state === 'idle' ? (
              <Typography>No emails found.</Typography>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
