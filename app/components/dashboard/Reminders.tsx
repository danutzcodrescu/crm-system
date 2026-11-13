import Alarm from '@mui/icons-material/Alarm';
import { Alert, Box, Button, Card, CardContent, Link, Stack, Tooltip, Typography } from '@mui/material';
import { isAfter } from 'date-fns';
import { useState } from 'react';
import { Fragment } from 'react/jsx-runtime';
import { Link as RLink, useFetcher } from 'react-router';

import type { loader } from '~/api/reminders/route';
import { formatDate } from '~/utils/client/dates';
import type { ReminderData } from '~/utils/server/repositories/reminders.server';

interface RemindersProps {
  reminders: ReminderData[];
  remindersCount: number;
}

export default function Reminders({ reminders, remindersCount }: RemindersProps) {
  const [showAll, setShowAll] = useState(false);
  const fetcher = useFetcher<typeof loader>();
  const allReminders = typeof fetcher.data?.message === 'object' ? fetcher.data.message.reminders : undefined;
  const data = showAll ? (allReminders ?? reminders) : reminders;
  const isLoading = showAll && fetcher.state !== 'idle';
  const error =
    showAll && fetcher.state === 'idle' && typeof fetcher.data?.message === 'string' ? fetcher.data.message : null;

  const toggleReminders = () => {
    if (!showAll) {
      // Loaded fetchers are automatically revalidated by React Router after
      // actions. No effect is needed to mirror their results into local state.
      fetcher.load('/api/reminders');
    }
    setShowAll(!showAll);
  };

  return (
    <Card component="section" aria-label="Reminders" sx={{ bgcolor: 'background.paper', flexBasis: '100%' }}>
      <CardContent>
        <Stack
          direction="row"
          sx={{
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold', flex: 1 }}>
            Reminders
          </Typography>
          <Stack
            direction="row"
            sx={{
              gap: 1,
              alignItems: 'center',
            }}
          >
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              All due reminders:{' '}
              <Box
                component="span"
                sx={{
                  fontWeight: 'bold',
                }}
              >
                {remindersCount}
              </Box>
            </Typography>
            {remindersCount > 0 ? (
              <Button onClick={toggleReminders}>{showAll ? 'Show only recent reminders' : 'Show all reminders'}</Button>
            ) : null}
          </Stack>
        </Stack>
        {isLoading ? <Typography role="status">Loading reminders…</Typography> : null}
        {error ? (
          <Alert severity="error" action={<Button onClick={() => fetcher.load('/api/reminders')}>Retry</Button>}>
            {error}
          </Alert>
        ) : null}
        {data.length === 0 ? (
          <Typography
            sx={{
              color: 'text.secondary',
            }}
          >
            No reminders
          </Typography>
        ) : null}
        {data.length > 0 ? (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: `max-content 1fr max-content 1fr`,
              gap: 3,
            }}
          >
            {data.map((reminder) => (
              <Fragment key={reminder.id}>
                <Link component={RLink} to={`/municipalities/${reminder.companyId}`} prefetch="intent">
                  {reminder.companyName}
                </Link>
                <Stack
                  direction="row"
                  sx={{
                    gap: 1,
                    alignItems: 'center',
                  }}
                >
                  <Alarm color={isAfter(new Date(reminder.date), new Date()) ? 'primary' : 'error'} />
                  <Tooltip title={reminder.description}>
                    <Typography variant="body2" component="span">
                      {formatDate(reminder.date)}
                    </Typography>
                  </Tooltip>
                </Stack>
              </Fragment>
            ))}
          </Box>
        ) : null}
      </CardContent>
    </Card>
  );
}
