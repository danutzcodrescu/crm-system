import Alarm from '@mui/icons-material/Alarm';
import { Box, Button, Card, CardContent, Link, Stack, Tooltip, Typography } from '@mui/material';
import { Link as RLink, useFetcher } from '@remix-run/react';
import { isAfter } from 'date-fns';
import { useEffect, useState } from 'react';
import { Fragment } from 'react/jsx-runtime';

import { loader } from '~/api/reminders/route';
import { formatDate } from '~/utils/client/dates';
import { ReminderData } from '~/utils/server/repositories/reminders.server';

interface RemindersProps {
  reminders: ReminderData[];
  remindersCount: number;
}

export default function Reminders({ reminders, remindersCount }: RemindersProps) {
  const [showAll, setShowAll] = useState(false);
  const [data, setData] = useState<ReminderData[]>(reminders);
  const fetcher = useFetcher<typeof loader>();

  useEffect(() => {
    if (!showAll) {
      setData(reminders);
    } else {
      fetcher.submit(null, {
        method: 'GET',
        action: '/api/reminders',
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showAll, reminders]);

  useEffect(() => {
    if (fetcher.data && typeof fetcher.data.message === 'object' && 'reminders' in fetcher.data.message) {
      setData(
        fetcher.data.message.reminders.map((reminder) => ({
          ...reminder,
          date: new Date(reminder.date),
        })) as ReminderData[],
      );
    }
  }, [fetcher.data]);

  return (
    <Card sx={{ bgcolor: 'background.paper', flexBasis: '100%' }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" gutterBottom sx={{ color: 'text.primary', fontWeight: 'bold', flex: 1 }}>
            Reminders
          </Typography>
          <Stack direction="row" gap={1} alignItems="center">
            <Typography variant="body2" sx={{ color: 'text.secondary' }}>
              All due reminders:{' '}
              <Box component="span" fontWeight="bold">
                {remindersCount}
              </Box>
            </Typography>
            {remindersCount > 0 ? (
              <Button onClick={() => setShowAll((prev) => !prev)}>
                {showAll ? 'Show only recent reminders' : 'Show all reminders'}
              </Button>
            ) : null}
          </Stack>
        </Stack>
        {data.length === 0 ? <Typography color="text.secondary">No reminders</Typography> : null}
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
                <Stack direction="row" gap={1} alignItems="center">
                  <Alarm color={isAfter(new Date(reminder.date), new Date()) ? 'primary' : 'error'} />
                  <Tooltip title={reminder.description}>
                    <Typography variant="body2" component="span">
                      {formatDate(typeof reminder.date === 'string' ? reminder.date : reminder.date.toISOString())}
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
