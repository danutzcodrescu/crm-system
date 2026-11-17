import { index, route, type RouteConfig } from '@react-router/dev/routes';

export default [
  route('signin', 'views/login/route.tsx'),
  route('signup', 'views/signup/route.tsx'),
  route('api/emails', 'api/emails/route.tsx', [
    route(':messageId/attachments/:attachmentId', 'api/emails/attachment.ts'),
  ]),
  route('api/reminders', 'api/reminders/route.tsx'),
  route('api/auth', 'api/auth/route.ts'),
  route('municipalities/:municipalityId/:filename', 'api/municipalities/compensation-pdf.ts'),
  route('api/reporting/import', 'api/reporting/import.ts'),
  route('api/general-information/import', 'api/general-information/import.ts'),
  route('api/invoicing/import', 'api/invoicing/import.ts'),
  route('api/responsibles', 'api/responsibles/responsibles.tsx', [route('import', 'api/responsibles/import.ts')]),
  route('api/municipalities', 'api/municipalities/layout.tsx', [
    route(':companyId', 'api/municipalities/route.ts'),
    route(':companyId/responsibles', 'api/municipalities/responsibles.ts'),
    route(':companyId/responsibles/:responsibleId', 'api/municipalities/responsible.ts'),
    route(':companyId/reminders', 'api/municipalities/reminders.ts'),
  ]),
  route('api/logs', 'api/notes-log/layout.tsx', [
    route(':companyId', 'api/notes-log/companyLog.ts'),
    route(':companyId/:logId', 'api/notes-log/log.ts'),
  ]),
  route('/', 'views/layout.tsx', [
    index('views/dashboard/route.tsx'),
    route('initial-consultation', 'views/initialConsultation/route.tsx'),
    route('agreement', 'views/agreement/route.tsx'),
    route('recurring-consultation', 'views/recurringConsultation/route.tsx'),
    route('reporting', 'views/reporting/route.tsx'),
    route('general-information', 'views/generalInformation/route.tsx'),
    route('compensation', 'views/compensation/route.tsx'),
    route('invoicing', 'views/invoicing/route.tsx'),
    route('municipalities', 'views/municipalities/layout.tsx', [
      index('views/municipalities/route.tsx'),
      route(':municipalityId', 'views/municipalities/municipality.tsx'),
    ]),
    route('logs', 'views/logsPerPeriod/route.tsx'),
    route('statuses', 'views/statuses/route.tsx'),
    route('years', 'views/years/route.tsx'),
    route('process', 'views/process/route.tsx'),
  ]),
  route('gmail-auth-redirect', 'views/gmail/route.tsx'),
  route('*', 'views/not-found.tsx'),
] satisfies RouteConfig;
