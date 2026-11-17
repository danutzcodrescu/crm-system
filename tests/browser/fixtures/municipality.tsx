import { CssBaseline, ThemeProvider } from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { sv } from 'date-fns/locale';
import { useEffect } from 'react';
import { createMemoryRouter, RouterProvider } from 'react-router';

import { theme } from '../../../app/utils/theme';
import Municipality from '../../../app/views/municipalities/municipality';

// Synthetic loader output. The real view and all its UI children remain intact;
// importing only the default view lets Vite tree-shake server-only loader code.
const date = new Date('2026-11-16T23:30:00Z');
const data = {
  severity: 'success',
  message: {
    municipality: {
      id: 'synthetic',
      name: 'Synthetic municipality',
      computedStatus: 'Active',
      workingCategory: 'wave 1',
      wave: '1',
      consultations: [],
      responsibleId: null,
      infoVerified: date,
    },
    users: [],
    responsibles: [
      {
        id: 'contact',
        name: 'Synthetic contact',
        title: 'Coordinator',
        email: 'test@example.invalid',
        updatedAt: date,
      },
    ],
    logs: [{ id: 'log', date, description: 'Synthetic log', reminderId: null }],
    initialConsultation: {
      id: 'initial',
      documentSent: date,
      isSigned: true,
      dateSigned: date,
      isShared: true,
      dateShared: date,
      link: null,
    },
    agreement: {
      id: 'agreement',
      typeOfAgreement: 'new',
      oldAgreementSent: false,
      oldAgreementDateSigned: null,
      oldAgreementDateShared: null,
      oldAgreementLink: null,
      oldAgreementAppendix: null,
      newAgreementDateSent: date,
      newAgreementDateSigned: date,
      newAgreementShared: true,
      newAgreementDateShared: date,
      newAgreementLink: null,
    },
    recurringConsultation: { data: [], years: [] },
    reporting: [{ id: 'synthetic', year: 2026, reportingDate: date, cigaretteButts: 123.45, motivation: 'Synthetic' }],
    generalInformation: [
      {
        id: 'synthetic',
        year: 2026,
        inhabitants: 12000,
        landSurface: 250.5,
        cleaningCost: 100000,
        cleanedKg: 250,
        epaMeasurement: true,
      },
    ],
    compensation: [],
    invoicing: [
      {
        id: 'invoice',
        year: 2026,
        invoiceAmount: 15000.5,
        vat: 3750.12,
        invoiceInfoSent: true,
        invoiceDate: date,
        datePaid: date,
      },
    ],
    emailAddress: '',
  },
};

function Ready() {
  useEffect(() => {
    document.documentElement.dataset.hydrated = 'true';
  }, []);
  return <Municipality />;
}

export function MunicipalityFixture() {
  const router = createMemoryRouter([{ id: 'municipality', path: '*', loader: () => data, Component: Ready }], {
    initialEntries: ['/municipalities/synthetic'],
    hydrationData: { loaderData: { municipality: data } },
  });
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sv}>
        <RouterProvider router={router} />
      </LocalizationProvider>
    </ThemeProvider>
  );
}
