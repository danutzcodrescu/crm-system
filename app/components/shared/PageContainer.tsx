import { Alert, AlertColor, Box, BoxProps, Snackbar, Stack, Typography } from '@mui/material';
import { PropsWithChildren, useEffect, useState } from 'react';

interface Props extends PropsWithChildren {
  title: string | React.ReactNode;
  additionalTitleElement: React.ReactNode;
  actionData?: { message: string; severity: string; timeStamp?: number };
  sx?: BoxProps['sx'];
}

export function PageContainer({ children, title, additionalTitleElement, actionData: parentActionData, sx }: Props) {
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
    <Box
      sx={{
        width: '100%',
        maxHeight: 'calc(100vh - 49px)',
        p: 1.5,
        overflow: 'hidden',
        minHeight: 'calc(100vh - 49px)',
        '&:has(#years-selector) .MuiTableContainer-root': {
          maxHeight: 'calc(100vh - 200px - 20px)',
        },
        ...sx,
      }}
    >
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
