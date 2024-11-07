/* eslint-disable @typescript-eslint/no-explicit-any */
import Edit from '@mui/icons-material/Edit';
import { TabContext, TabList, TabPanel } from '@mui/lab';
import { Box, Chip, IconButton, Tab, Tooltip, Typography } from '@mui/material';
import { json, LoaderFunctionArgs, redirect } from '@remix-run/node';
import { useFetcher, useLoaderData } from '@remix-run/react';
import { useCallback, useState } from 'react';

import { action as deleteLogAction } from '~/api/notes-log/route';
import { CompanyDetails } from '~/components/companies/CompanyDetails';
import { EmployeesTable } from '~/components/companies/EmployeesTable';
import { LogsTable } from '~/components/companies/LogsTable';
import { MeetingsTable } from '~/components/companies/MeetingsTable';
import { RemindersTable } from '~/components/companies/RemindersTable';
import { PageContainer } from '~/components/shared/PageContainer';
import { auth } from '~/utils/server/auth.server';
import { getCompany } from '~/utils/server/repositories/companies.server';
import { getEmployeesForCompany } from '~/utils/server/repositories/employees.server';
import { getLogsForCompany } from '~/utils/server/repositories/notes-log.server';
import { getRemindersPerCompany, Reminder } from '~/utils/server/repositories/reminders.server';
import { getAllStatuses } from '~/utils/server/repositories/status.server';
type TabValues = 'logs' | 'employees' | 'reminders' | 'meetings';

export async function loader({ request, params }: LoaderFunctionArgs) {
  const isLoggedIn = await auth.isLoggedIn(request);
  if (!isLoggedIn) return redirect('/signin');

  const id = params.companyId as string;
  const [logsResp, companyResp, employeesResp, statusesResp, remindersResp] = await Promise.all([
    getLogsForCompany(id),
    getCompany(id),
    getEmployeesForCompany(id),
    getAllStatuses(),
    getRemindersPerCompany(id),
  ]);
  if (logsResp[0] || companyResp[0] || employeesResp[0] || remindersResp[0]) {
    return json({ message: 'Could not fetch data for company', severity: 'error' }, { status: 500 });
  }
  return json({
    message: {
      logs: logsResp[1],
      company: companyResp[1],
      employees: employeesResp[1],
      statuses: statusesResp,
      reminders: remindersResp[1],
    },
    severity: 'success',
  });
}

export default function Company() {
  const data = useLoaderData<typeof loader>();
  const [isEditing, setEditingMode] = useState(false);
  const [tabValue, setTabValue] = useState<TabValues>('logs');
  const fetcher = useFetcher<typeof deleteLogAction>();

  const handleChange = useCallback((_: React.SyntheticEvent, newValue: TabValues) => {
    setTabValue(newValue);
  }, []);

  return (
    <PageContainer
      title={
        <Typography
          variant="h5"
          component="h1"
          fontWeight="bold"
          sx={{ flex: 1, display: 'flex', gap: 1, alignItems: 'center' }}
        >
          {(data.message as any).company.name} <Chip color="primary" label={(data.message as any).company.statusName} />
        </Typography>
      }
      additionalTitleElement={
        <Tooltip title={`Edit commune ${(data.message as any).company.name}`}>
          <IconButton onClick={() => setEditingMode(true)} aria-label="Edit commune">
            <Edit />
          </IconButton>
        </Tooltip>
      }
      actionData={fetcher.data}
    >
      <CompanyDetails
        statusId={(data.message as any).company.statusId}
        statusName={(data.message as any).company.statusName}
        onCancel={() => setEditingMode(false)}
        statuses={(data.message as any).statuses}
        isEditing={isEditing}
      />
      <Box sx={{ mt: 2 }}>
        <TabContext value={tabValue}>
          <TabList
            onChange={handleChange}
            sx={{ borderBottom: '1px solid', borderColor: (theme) => theme.palette.divider }}
          >
            <Tab value="logs" label="Notes" />
            <Tab value="employees" label="Contacts" />
            <Tab value="reminders" label="Reminders" />
            <Tab value="meetings" label="Meetings" />
          </TabList>
          <TabPanel value="logs">
            <LogsTable
              data={(data as any).message.logs}
              employees={(data as any).message.employees}
              fetcher={fetcher}
            />
          </TabPanel>
          <TabPanel value="employees">
            <EmployeesTable
              fetcher={fetcher}
              data={(data as any).message.employees}
              companyId={(data as any).message.company.id}
            />
          </TabPanel>
          <TabPanel value="reminders">
            <RemindersTable
              data={(data as any).message.reminders.filter((r: Reminder) => r.type === 'reminder')}
              employees={(data as any).message.employees}
              fetcher={fetcher}
              companyId={(data as any).message.company.id}
            />
          </TabPanel>
          <TabPanel value="meetings">
            <MeetingsTable
              fetcher={fetcher}
              data={(data as any).message.reminders.filter((r: Reminder) => r.type === 'meeting')}
              companyId={(data as any).message.company.id}
            />
          </TabPanel>
        </TabContext>
      </Box>
    </PageContainer>
  );
}
