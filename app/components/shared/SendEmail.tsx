import Email from '@mui/icons-material/Email';
import { IconButton, Tooltip } from '@mui/material';
import { useFetcher } from '@remix-run/react';
import { useCallback, useEffect } from 'react';

import { action } from '~/api/responsibles/responsibles';
import { useIds } from '~/utils/store';

export function SendEmail() {
  const ids = useIds((state) => state.companyIds);
  const fetcher = useFetcher<typeof action>();

  useEffect(() => {
    // @ts-expect-error type mismatch
    if (fetcher.state === 'idle' && fetcher.data?.message) {
      // @ts-expect-error type mismatch
      navigator.clipboard.writeText(fetcher.data?.message as string).then(() => {
        window?.open(`https://mail.google.com/mail/?view=cm`, '_blank');
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetcher.data]);

  const collectEmailAddresses = useCallback(() => {
    fetcher.submit(
      { ids: JSON.stringify(ids.join(',')) },
      { method: 'POST', action: '/api/responsibles', relative: 'path' },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  return (
    <Tooltip title="Send email">
      <IconButton size="small" aria-label="send email" onClick={collectEmailAddresses}>
        <Email />
      </IconButton>
    </Tooltip>
  );
}
