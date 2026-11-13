import { data as routeData, LoaderFunctionArgs, redirect } from 'react-router';

import { isLoggedIn } from '~/utils/server/auth.server';
import {
  clearRefreshToken,
  getAttachment,
  getRedirectUrlIfThereIsNoToken,
  isTokenSet,
} from '~/utils/server/services/gmail.server';

export async function loader({ request, params, url }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  if (!isTokenSet()) {
    await getRedirectUrlIfThereIsNoToken(request, url);
  }
  const searchParams = new URL(request.url).searchParams;
  const mimeType = searchParams.get('mimeType');
  const filename = searchParams.get('filename');
  if (!mimeType || !filename) {
    return routeData({ message: 'MimeType is required', severity: 'error' }, { status: 400 });
  }
  const messageId = params.messageId as string;
  const attachmentId = params.attachmentId as string;

  const [error, data] = await getAttachment(attachmentId, messageId);
  setImmediate(() => clearRefreshToken());
  if (error) {
    return routeData({ message: 'Could not fetch emails', severity: 'error' }, { status: 500 });
  }

  const decodedData = Buffer.from((data as string).replace(/-/g, '+').replace(/_/g, '/'), 'base64');

  return new Response(decodedData, {
    status: 200,
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `${process.env.NODE_ENV === 'development' ? 'inline' : 'attachment'}; filename="${filename}"`,
      'Content-Length': String(decodedData.length),
    },
  });
}
