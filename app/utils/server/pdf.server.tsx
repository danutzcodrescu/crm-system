import { renderToStream } from '@react-pdf/renderer';
import { LoaderFunctionArgs, redirect } from '@remix-run/node';

import { PDF } from '../../components/PDF.server';
import { isLoggedIn } from './auth.server';
import { logger } from './logger.server';
import { CompensationDataPerCompanyPerYear, getCompensationForCompanyByYear } from './repositories/compensation.server';

export async function handlePDFRequest(request: Request, headers: Headers) {
  // get the data for the PDF
  const response = (await loader({ request, context: {}, params: {} })) as CompensationDataPerCompanyPerYear;
  // if it's a response return it, this means we redirected
  if (response instanceof Response) return response;
  // set the correct content-type
  headers.set('Content-Type', 'application/pdf');
  headers.set(
    'Content-Disposition',
    `${process.env.NODE_ENV === 'development' ? 'inline' : 'attachment'}; filename="${response.companyName} ersättning ${response.year}.pdf"`,
  );
  // render the PDF to a stream
  const stream = await renderToStream(<PDF {...response} />);
  // wait for the stream to end and transform it to a Buffer
  const body: Buffer = await new Promise((resolve, reject) => {
    const buffers: Uint8Array[] = [];
    stream.on('data', (data) => {
      buffers.push(data);
    });
    stream.on('end', () => {
      resolve(Buffer.concat(buffers));
    });
    stream.on('error', reject);
  });
  // return the response
  return new Response(new Uint8Array(body), { status: 200, headers });
}

export async function loader({ request }: LoaderFunctionArgs) {
  const isAuthenticated = await isLoggedIn(request);
  if (!isAuthenticated) return redirect('/signin');
  const pathname = new URL(request.url).pathname;
  const segments = pathname.split('/').slice(1);
  const [error, data] = await getCompensationForCompanyByYear(segments[1], parseInt(segments[2].replace('.pdf', '')));

  if (error) {
    logger.error(`PDF generation error: ${error}`);
    return redirect('/');
  }

  return data;
}
