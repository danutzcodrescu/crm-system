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
  ];

  return <DataTable<CompensationDataPerCompany> data={data} columns={columns} yearKey="year" nameKey="id" />;
}
