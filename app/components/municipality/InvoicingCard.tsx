import Edit from '@mui/icons-material/Edit';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import {
  Box,
  Card,
  CardContent,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { FetcherWithComponents } from '@remix-run/react';
import { useCallback, useState } from 'react';
import { ClientOnly } from 'remix-utils/client-only';

import { EditDialog } from '~/components/shared/EditDialog.client';
import { useEditFields } from '~/hooks/editFields';
import { formatDate } from '~/utils/client/dates';
import type { InvoicingData } from '~/utils/server/repositories/invoicing.server';

interface Props {
  data: InvoicingData[];
  fetcher: FetcherWithComponents<unknown>;
}

export function InvoicingCard({ data, fetcher }: Props) {
  const years = [...new Set(data.map((item) => item.year))].sort((a, b) => b - a);
  const [value, setValue] = useState(years[0].toString());
  const { setEditableData, fields, setFields } = useEditFields(fetcher);

  const handleChange = (_: React.SyntheticEvent, newValue: string) => {
    setValue(newValue);
  };

  const handleEdit = useCallback(
    (yearData: InvoicingData) => {
      setEditableData([
        {
          label: 'id',
          name: 'companyId',
          type: 'text',
          defaultValue: yearData.id,
          hidden: true,
        },
        {
          label: 'year',
          name: 'year',
          type: 'number',
          defaultValue: parseInt(value),
          hidden: true,
        },
        {
          label: 'Invoice date',
          name: 'invoiceDate',
          type: 'date',
          defaultValue: yearData.invoiceDate as unknown as string,
        },
        {
          label: 'Time for paying the invoice ',
          name: 'datePaid',
          type: 'date',
          defaultValue: yearData.datePaid as unknown as string,
        },
        {
          label: 'Amount paid out excluding VAT',
          name: 'invoiceAmount',
          type: 'number',
          defaultValue: yearData.invoiceAmount,
          inputProps: { step: '0.01' },
        },
        {
          label: 'Vat not paid out',
          name: 'vat',
          type: 'number',
          defaultValue: yearData.vat,
          inputProps: { step: '0.01' },
        },
      ]);
    },
    [setEditableData, value],
  );

  return (
    <>
      <Card>
        <CardContent>
          <Stack direction="column" gap={2}>
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Typography variant="h6" component="h2" gutterBottom sx={{ flex: 1 }}>
                  Invoicing Information
                </Typography>
                <IconButton
                  onClick={() => handleEdit(data.find((d) => d.year.toString() === value) as InvoicingData)}
                  size="small"
                >
                  <Edit />
                </IconButton>
              </Box>
              <TabContext value={value}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <TabList onChange={handleChange} aria-label="Invoicing years">
                    {years.toSorted().map((year) => (
                      <Tab key={year} label={year} value={year.toString()} />
                    ))}
                  </TabList>
                </Box>
                {years.map((year) => {
                  const yearData = data.find((item) => item.year === year);
                  if (!yearData) return null;

                  return (
                    <TabPanel key={year} value={year.toString()}>
                      <Stack spacing={10} direction="row" alignItems="flex-start">
                        <Box>
                          <Stack spacing={1}>
                            <Typography>
                              Invoice received from municipality:{' '}
                              <Box component="span">{yearData.invoiceReceived ? 'Yes' : 'No'}</Box> /{' '}
                              <Box component="span">N/A</Box>
                            </Typography>
                            <Typography>
                              Time for receiving invoice:{' '}
                              {yearData.invoiceDate ? (
                                <Box component="span">{formatDate(yearData.invoiceDate as unknown as string)}</Box>
                              ) : (
                                <Box component="span">N/A</Box>
                              )}
                            </Typography>
                            <Typography>
                              Invoice paid by SUP Filter:{' '}
                              <Box component="span">{yearData.invoicePaid ? 'Yes' : 'No'}</Box> /{' '}
                              <Box component="span">N/A</Box>
                            </Typography>
                            <Typography>
                              Time for paying the invoice:{' '}
                              {yearData.datePaid ? (
                                <Box component="span">{formatDate(yearData.datePaid as unknown as string)}</Box>
                              ) : (
                                <Box component="span">N/A</Box>
                              )}
                            </Typography>
                          </Stack>
                        </Box>

                        <Box>
                          <Typography variant="subtitle1" gutterBottom>
                            SEK paid by SUP Filter to municipality:
                          </Typography>
                          <TableContainer>
                            <Table size="small">
                              <TableHead>
                                <TableRow>
                                  <TableCell>Amount</TableCell>
                                  <TableCell>Eligible</TableCell>
                                  <TableCell>Paid</TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                <TableRow>
                                  <TableCell>{yearData.invoiceAmount ?? 'N/A'}</TableCell>
                                  <TableCell>{yearData.totalCompensation ?? 'N/A'}</TableCell>
                                  <TableCell>{yearData.invoicePaid ? yearData.totalCompensation : 'N/A'}</TableCell>
                                </TableRow>
                              </TableBody>
                            </Table>
                          </TableContainer>
                          <Typography sx={{ mt: 2 }}>
                            VAT not paid out: <Box component="span">{yearData.vat ?? 'N/A'}</Box>
                          </Typography>
                        </Box>
                      </Stack>
                    </TabPanel>
                  );
                })}
              </TabContext>
            </Box>
          </Stack>
        </CardContent>
      </Card>
      <ClientOnly>
        {() => (
          <EditDialog
            isOpen={!!fields.length}
            handleClose={() => setFields([])}
            fields={fields}
            title={`Edit invoicing for ${data?.find((d) => d.id === fields[0]?.defaultValue)?.companyName} for ${fields[1]?.defaultValue}`}
            fetcher={fetcher}
            url="/invoicing"
          />
        )}
      </ClientOnly>
    </>
  );
}
