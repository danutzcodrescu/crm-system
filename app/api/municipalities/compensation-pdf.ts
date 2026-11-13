import type { LoaderFunctionArgs } from 'react-router';

import { handlePDFRequest } from '~/utils/server/pdf.server';

export async function loader({ request, params }: LoaderFunctionArgs) {
  // React Router matches whole segments, not partial parameters like :year.pdf.
  if (!params.municipalityId || !params.filename || !/^\d{4}\.pdf$/.test(params.filename)) {
    throw new Response('Not Found', { status: 404 });
  }

  return handlePDFRequest(request, params.municipalityId, Number(params.filename.slice(0, -4)));
}
