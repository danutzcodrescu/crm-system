import { Alert, AlertColor, Box, Snackbar, Stack, Typography } from '@mui/material';
import { useActionData } from '@remix-run/react';
import { PropsWithChildren, useEffect, useState } from 'react';

interface Props extends PropsWithChildren {
  title: string;
  additionalTitleElement: React.ReactNode;
  actionData?: { message: string; severity: string; timeStamp?: number };
}

export function PageContainer({ children, title, additionalTitleElement, actionData: parentActionData }: Props) {
  const actionData = useActionData<{ message: string; severity: string; timeStamp?: number }>();
  const [isAlertOpen, setAlertStatus] = useState(false);

  useEffect(() => {
    if ((actionData?.message || parentActionData?.message) && !isAlertOpen) {
      setAlertStatus(true);
    }
    if (!actionData?.message && !parentActionData?.message && isAlertOpen) {
      setAlertStatus(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actionData?.timeStamp, parentActionData?.timeStamp, parentActionData?.timeStamp]);

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
        <Alert
          severity={
            actionData?.severity && parentActionData?.severity && actionData?.timeStamp && parentActionData?.timeStamp
              ? actionData?.timeStamp > parentActionData?.timeStamp
                ? (actionData.severity as AlertColor)
                : (parentActionData.severity as AlertColor)
              : ((actionData?.severity || parentActionData?.severity) as AlertColor)
          }
          onClose={() => setAlertStatus(false)}
        >
          {actionData?.message && parentActionData?.message && actionData?.timeStamp && parentActionData?.timeStamp
            ? actionData?.timeStamp > parentActionData?.timeStamp
              ? actionData.message
              : parentActionData.message
            : ((actionData?.message || parentActionData?.message) as AlertColor)}
        </Alert>
      </Snackbar>
    </Box>
  );
}
