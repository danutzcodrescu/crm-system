import PictureAsPdf from '@mui/icons-material/PictureAsPdf';
import { IconButton, Link } from '@mui/material';

import type { CompensationDataPerCompany } from '~/utils/server/repositories/compensation.server';

import { Column, DataTable, renderNumber } from './DataTable';

interface Props {
  data: CompensationDataPerCompany[];
}

export function CompensationTable({ data }: Props) {
  const columns: Column<CompensationDataPerCompany>[] = [
    {
      label: 'Agreement Type',
      key: 'typeOfAgreement',
    },

    {
      label: 'Old Compensation',
      key: 'old',
      render: (value) => renderNumber(value),
    },
    {
      label: 'New Compensation',
      key: 'new',
      render: (value) => renderNumber(value),
    },
    {
      label: 'Details',
      key: 'year',
      render: (year) => (
        <IconButton LinkComponent={Link} href={`/municipalities/${data[0].id}/${year}.pdf`} target="_blank">
          <PictureAsPdf />
        </IconButton>
      ),
    },
  ];

  return <DataTable<CompensationDataPerCompany> data={data} columns={columns} yearKey="year" nameKey="id" />;
}
