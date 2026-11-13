import { renderToStream } from '@react-pdf/renderer';
import { redirect } from 'react-router';

import { PDF } from '../../components/PDF.server';
import { isLoggedIn } from './auth.server';
import { logger } from './logger.server';
import { getCompensationForCompanyByYear } from './repositories/compensation.server';

export async function handlePDFRequest(request: Request, municipalityId: string, year: number) {
  if (!(await isLoggedIn(request))) return redirect('/signin');

  const [error, response] = await getCompensationForCompanyByYear(municipalityId, year);
  if (error) {
    logger.error(`PDF generation error: ${error}`);
    return redirect('/');
  }
  if (!response) throw new Response('Not Found', { status: 404 });

  const headers = new Headers();
  // set the correct content-type
  headers.set('Content-Type', 'application/pdf');
  const filename = `${response.companyName} ersättning ${response.year}.pdf`;
  const encodedFilename = encodeURIComponent(filename).replace(
    /[!'()*]/g,
    (character) => `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
  );
  headers.set(
    'Content-Disposition',
    `${process.env.NODE_ENV === 'development' ? 'inline' : 'attachment'}; filename="compensation-${response.year}.pdf"; filename*=UTF-8''${encodedFilename}`,
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
