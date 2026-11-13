import { companyId, contactId, logId, year } from './fixtures';

// One entry per registered leaf/endpoint. Layouts are exercised through their children.
// The inventory test compares this with Vite's real route registrations.
export const pages = [
  { path: '/', file: 'views/dashboard/route.tsx', title: 'Dashboard', table: false },
  {
    path: '/initial-consultation',
    file: 'views/initialConsultation/route.tsx',
    title: 'Initial consultation',
    table: true,
  },
  { path: '/agreement', file: 'views/agreement/route.tsx', title: 'Agreement stage', table: true },
  {
    path: `/recurring-consultation?year=${year}`,
    file: 'views/recurringConsultation/route.tsx',
    title: 'Recurring consultation',
    table: true,
  },
  { path: `/reporting?year=${year}`, file: 'views/reporting/route.tsx', title: 'Reporting', table: true },
  {
    path: `/general-information?year=${year}`,
    file: 'views/generalInformation/route.tsx',
    title: 'General information',
    table: true,
  },
  { path: `/compensation?year=${year}`, file: 'views/compensation/route.tsx', title: 'Compensation', table: true },
  { path: `/invoicing?year=${year}`, file: 'views/invoicing/route.tsx', title: 'Invoicing', table: true },
  { path: '/municipalities', file: 'views/municipalities/route.tsx', title: 'Municipalities', table: true },
  {
    path: `/municipalities/${companyId}`,
    file: 'views/municipalities/municipality.tsx',
    title: 'Smoke Åby',
    table: true,
  },
  { path: '/logs', file: 'views/logsPerPeriod/route.tsx', title: 'Latest logs', table: true },
  { path: '/statuses', file: 'views/statuses/route.tsx', title: 'Statuses', table: false },
  { path: '/years', file: 'views/years/route.tsx', title: 'Years', table: false },
  { path: '/process', file: 'views/process/route.tsx', title: 'Process', table: true },
];

type ApiScenario = {
  path: string;
  file: string;
  method: string;
  status: number;
  message?: string;
  upload?: boolean;
  form?: Record<string, string>;
};

export const apis: ApiScenario[] = [
  {
    path: '/api/emails',
    file: 'api/emails/route.tsx',
    method: 'GET',
    status: 400,
    message: 'Municipality ID is required',
  },
  {
    path: '/api/emails/smoke-message/attachments/smoke-attachment',
    file: 'api/emails/attachment.ts',
    method: 'GET',
    status: 400,
    message: 'MimeType is required',
  },
  { path: '/api/reminders', file: 'api/reminders/route.tsx', method: 'GET', status: 200 },
  {
    path: '/api/reporting/import',
    file: 'api/reporting/import.ts',
    method: 'POST',
    status: 400,
    message: 'Invalid file',
    upload: true,
  },
  {
    path: '/api/general-information/import',
    file: 'api/general-information/import.ts',
    method: 'POST',
    status: 400,
    message: 'Invalid file',
    upload: true,
  },
  {
    path: '/api/invoicing/import',
    file: 'api/invoicing/import.ts',
    method: 'POST',
    status: 400,
    message: 'Invalid file',
    upload: true,
  },
  {
    path: '/api/responsibles/import',
    file: 'api/responsibles/import.ts',
    method: 'POST',
    status: 400,
    message: 'Invalid file',
    upload: true,
  },
  {
    path: '/api/responsibles',
    file: 'api/responsibles/responsibles.tsx',
    method: 'POST',
    status: 200,
    form: { ids: JSON.stringify(companyId) },
  },
  { path: '/api/municipalities', file: 'api/municipalities/layout.tsx', method: 'GET', status: 200 },
  {
    path: `/api/municipalities/${companyId}`,
    file: 'api/municipalities/route.ts',
    method: 'PATCH',
    status: 200,
    form: { wave: '1' },
  },
  {
    path: `/api/municipalities/${companyId}/responsibles`,
    file: 'api/municipalities/responsibles.ts',
    method: 'POST',
    status: 200,
    form: {
      name: 'Created smoke contact',
      email: 'created@example.invalid',
      phoneNumber: '0101234',
      mobileNumber: '0701234',
      title: 'Tester',
    },
  },
  {
    path: `/api/municipalities/${companyId}/responsibles/${contactId}`,
    file: 'api/municipalities/responsible.ts',
    method: 'PATCH',
    status: 200,
    form: {
      name: 'Smoke Contact',
      email: 'contact@example.invalid',
      phoneNumber: '010123456',
      mobileNumber: '070123456',
      title: 'Coordinator',
    },
  },
  {
    path: `/api/municipalities/${companyId}/reminders`,
    file: 'api/municipalities/reminders.ts',
    method: 'POST',
    status: 200,
    form: { description: 'Created smoke reminder', date: `${year}-12-15`, logId },
  },
  { path: '/api/logs', file: 'api/notes-log/layout.tsx', method: 'POST', status: 400, message: 'Missing parameters' },
  {
    path: `/api/logs/${companyId}`,
    file: 'api/notes-log/companyLog.ts',
    method: 'POST',
    status: 400,
    message: 'Missing parameters',
  },
  {
    path: `/api/logs/${companyId}/${logId}`,
    file: 'api/notes-log/log.ts',
    method: 'PATCH',
    status: 400,
    message: 'Missing parameters',
  },
  {
    path: '/gmail-auth-redirect',
    file: 'views/gmail/route.tsx',
    method: 'GET',
    status: 400,
    message: 'Missing code or state',
  },
];

export const editablePages = pages.filter(({ path }) =>
  [
    '/initial-consultation',
    '/agreement',
    '/recurring-consultation',
    '/reporting',
    '/general-information',
    '/invoicing',
    '/statuses',
    '/years',
  ].includes(path.split('?')[0]),
);

export function dataUrl(path: string, file: string) {
  const url = new URL(path, 'http://smoke.invalid');
  url.pathname = url.pathname === '/' ? '/_root.data' : `${url.pathname.replace(/\/$/, '')}.data`;
  url.searchParams.set('_routes', file.replace(/\.tsx?$/, ''));
  return `${url.pathname}${url.search}`;
}
