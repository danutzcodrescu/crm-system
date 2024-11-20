import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { Box, Button } from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';

interface Props {
  fetcher: FetcherWithComponents<unknown>;
}

export function UploadCompaniesData({ fetcher }: Props) {
  return (
    <Button component="label" role={undefined} variant="contained" tabIndex={-1} startIcon={<CloudUploadIcon />}>
      Upload files
      <Box
        component="input"
        type="file"
        onChange={
          (e) => {
            if (e.target.files?.[0]) {
              const formData = new FormData();
              formData.append('communes', e.target.files?.[0] as File);
              fetcher.submit(formData, {
                method: 'POST',
                action: '/api/import/communes',
                relative: 'path',
                encType: 'multipart/form-data',
              });
            }
          }
          // fetcher.submit(
          //   // eslint-disable-next-line @typescript-eslint/no-explicit-any
          //   { communes: e.target.files?.[0] } as any,
          //   { method: 'POST', action: '/api/import/communes', relative: 'path', encType: 'multipart/form-data' },
          // )
        }
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
    </Button>
  );
}
