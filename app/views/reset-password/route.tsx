import { Box, Button, Card, CardContent, CardHeader, Stack, TextField } from '@mui/material';
import { ActionFunctionArgs, json, redirect } from '@remix-run/node';
import { Form, MetaFunction, useActionData, useLoaderData } from '@remix-run/react';
import { HoneypotInputs, HoneypotProvider } from 'remix-utils/honeypot/react';
import { SpamError } from 'remix-utils/honeypot/server';

import { getUserByIdAndUsername, resetPassword } from '~/utils/server/auth.server';
import { honeypot } from '~/utils/server/honeypot.server';
import { getSecret } from '~/utils/server/infisical.server';
import { logger } from '~/utils/server/logger.server';

export const loader = async () => {
  const resetEnabled = await getSecret('RESET_ENABLED');
  console.log(resetEnabled);
  if (resetEnabled.secretValue.toLocaleLowerCase() === 'false') {
    logger.info('Reset password is disabled');
    return redirect('/signin');
  }
  return json({ honeypotInputProps: await honeypot.getInputProps() });
};

export const meta: MetaFunction = () => {
  return [
    { title: 'CRM System - Reset password' },
    { name: 'description', content: 'Reset password page for the CRM System' },
  ];
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const formData = await request.formData();
  try {
    await honeypot.check(formData);
  } catch (error) {
    if (error instanceof SpamError) {
      throw json({ error: 'You seem to spam' }, { status: 451 });
    }
  }

  const username = formData.get('username');
  const password = formData.get('password');
  const id = formData.get('id');
  const repeatPassword = formData.get('repeat_password');

  if (password !== repeatPassword) {
    return json({ error: 'Passwords do not match' }, { status: 400 });
  }

  if (!username || !password || !id) {
    return json({ error: 'Username, id or password field cannot be empty' }, { status: 400 });
  }

  const user = await getUserByIdAndUsername(parseInt(id as string), username as string);

  if (!user) {
    return json({ error: 'User not found' }, { status: 400 });
  }

  const [error, cookie] = await resetPassword(parseInt(id as string), password as string, request);

  if (error) {
    return json({ error: 'There was an issue when trying to sign up' }, { status: 500 });
  }
  return redirect('/', {
    headers: {
      'Set-Cookie': cookie as string,
    },
    status: 301,
  });
};

export default function SignUpPage() {
  const data = useActionData<typeof action>();
  const { honeypotInputProps } = useLoaderData<typeof loader>();

  return (
    <HoneypotProvider {...honeypotInputProps}>
      <Box sx={{ display: 'grid', placeContent: 'center', width: '100vw', height: '100svh' }}>
        <Card>
          <CardHeader
            title="Reset password"
            subheader="Please enter your new password"
            titleTypographyProps={{
              sx: { textAlign: 'center', fontSize: '1.25rem', fontWeight: 'bold', marginBottom: 1.5 },
            }}
            subheaderTypographyProps={{ sx: { textAlign: 'center', fontSize: '0.875rem', fontWeight: 400 } }}
          ></CardHeader>
          <CardContent>
            <Form method="post">
              <HoneypotInputs label="Please leave this field blank" />
              <Stack gap={1.5}>
                <TextField size="small" name="username" label="Username" error={!!data?.error} />
                <TextField size="small" name="id" label="Username id" />
                <TextField
                  size="small"
                  name="password"
                  type="password"
                  label="Password"
                  {...(data?.error ? { helperText: data.error, error: true } : {})}
                />
                <TextField
                  size="small"
                  name="repeat_password"
                  type="password"
                  label="Confirm Password"
                  {...(data?.error ? { helperText: data.error, error: true } : {})}
                />
                <Button fullWidth variant="contained" type="submit">
                  Reset password
                </Button>
              </Stack>
            </Form>
          </CardContent>
        </Card>
      </Box>
    </HoneypotProvider>
  );
}
