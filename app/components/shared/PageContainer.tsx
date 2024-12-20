import { Alert, AlertColor, Box, Snackbar, Stack, Typography } from '@mui/material';
import { PropsWithChildren, useEffect, useState } from 'react';

interface Props extends PropsWithChildren {
  title: string | React.ReactNode;
  additionalTitleElement: React.ReactNode;
  actionData?: { message: string; severity: string; timeStamp?: number };
}

export function PageContainer({ children, title, additionalTitleElement, actionData: parentActionData }: Props) {
  const [isAlertOpen, setAlertStatus] = useState(false);

  useEffect(() => {
    if (parentActionData?.message && !isAlertOpen) {
      setAlertStatus(true);
    }
    if (!parentActionData?.message && isAlertOpen) {
      setAlertStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parentActionData?.timeStamp]);

  return (
    <Box sx={{ width: '100%', height: '100%', p: 1.5 }}>
      <Stack direction="row" alignItems="center" sx={{ mb: 2 }}>
        {typeof title === 'string' ? (
          <Typography variant="h5" component="h1" fontWeight="bold" sx={{ flex: 1 }}>
            {title}
          </Typography>
        ) : (
          title
        )}
        {additionalTitleElement}
      </Stack>
      {children}
      <Snackbar
        open={isAlertOpen}
        autoHideDuration={5000}
        onClose={() => setAlertStatus(false)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={parentActionData?.severity as AlertColor} onClose={() => setAlertStatus(false)}>
          {parentActionData?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
