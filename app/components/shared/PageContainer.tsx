import { Alert, AlertColor, Box, Snackbar, Stack, Typography } from '@mui/material';
import { useActionData } from '@remix-run/react';
import { PropsWithChildren, useEffect, useState } from 'react';

interface Props extends PropsWithChildren {
  title: string;
  additionalTitleElement: React.ReactNode;
}

export function PageContainer({ children, title, additionalTitleElement }: Props) {
  const actionData = useActionData<{ message: string; severity: string }>();
  const [isAlertOpen, setAlertStatus] = useState(false);

  useEffect(() => {
    if (actionData?.message && !isAlertOpen) {
      setAlertStatus(true);
    }
    if (!actionData?.message && isAlertOpen) {
      setAlertStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData?.message]);
  return (
    <Box sx={{ width: '100%', height: '100%', p: 1.5 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5" component="h1" fontWeight="bold" sx={{ flex: 1 }}>
          {title}
        </Typography>
        {additionalTitleElement}
      </Stack>
      {children}
      <Snackbar
        open={isAlertOpen}
        autoHideDuration={5000}
        onClose={() => setAlertStatus(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={actionData?.severity as AlertColor} onClose={() => setAlertStatus(false)}>
          {actionData?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
