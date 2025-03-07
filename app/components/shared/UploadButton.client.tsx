import { Box, IconButton, Tooltip } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ChangeEvent, useCallback } from 'react';
import { FetcherWithComponents } from '@remix-run/react';

interface UploadButtonProps {
  title: string;
  fetcher: FetcherWithComponents<unknown>;
  path: string;
  search: string;
}

export function UploadButton({ title, fetcher, path, search }: UploadButtonProps) {
  const handleSubmit = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
        const formData = new FormData();
        formData.append('file', e.target.files?.[0] as File);
        formData.append('year', new URLSearchParams(search).get('year') as string);
        fetcher.submit(formData, {
          method: 'POST',
          action: path,
          relative: 'path',
          encType: 'multipart/form-data',
        });
      }
    },
    [fetcher, search],
  );
  return (
    <Tooltip title={title}>
      <IconButton role={undefined} tabIndex={-1} component="label">
        <CloudUploadIcon />
        <Box
          component="input"
          type="file"
          onChange={handleSubmit}
          sx={{
            clip: 'rect(0 0 0 0)',
            clipPath: 'inset(50%)',
            height: 1,
            overflow: 'hidden',
            position: 'absolute',
            bottom: 0,
            left: 0,
            whiteSpace: 'nowrap',
            width: 1,
          }}
        />
      </IconButton>
    </Tooltip>
  );
}
