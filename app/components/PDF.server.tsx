import { Document, Link, Page, Text, View } from '@react-pdf/renderer';
import { CompensationDataPerCompanyPerYear } from '~/utils/server/repositories/compensation.server';

export function PDF(data: CompensationDataPerCompanyPerYear) {
  return (
    <Document
      title={`Compensation for ${data.companyName} year ${data.year}`}
      author="SUP Filter"
      subject="Compensation for cigarette butt collection"
    >
      <Page
        size="A4"
        style={{
          paddingTop: 48,
          paddingLeft: 72,
          paddingRight: 48,
          paddingBottom: 72,
          fontSize: 12,
          fontFamily: 'Helvetica',
        }}
      >
        <View style={{ marginBottom: 40 }}>
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Specified compensation for cigarette butt collection</Text>
          <Text style={{ fontSize: 20, marginBottom: 24 }}>
            {data.companyName} year {data.year}
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ marginBottom: 24, textAlign: 'justify' }}>
            According to chapter 8 of the agreement with SUP Filter, your municipality is entitled to annual
            compensation for the collection of cigarette butts. Appendix 8.1 of the agreement states the compensation
            amounts that apply, how they are adjusted each year and what they are based on. Information on payment terms
            and invoicing can be found in Appendix 8.2.
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ marginBottom: 12 }}>
            Total compensation:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE').format(data?.total as number)} SEK
            </Text>{' '}
            (A + B + C) x (D) x (E)
          </Text>
        </View>

        <View>
          <Text style={{ marginBottom: 8 }}>
            A) Variable remuneration:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE').format(data?.variableCompensation as number)} SEK
            </Text>{' '}
            (&nbsp;{Intl.NumberFormat('sv-SE', { minimumFractionDigits: 15 }).format(0.735147372938808)} SEK x &nbsp;
            {Intl.NumberFormat('sv-SE').format(data?.inhabitants as number)}&nbsp;inhabitants&nbsp;)
          </Text>
          <Text style={{ marginBottom: 8 }}>
            B) Reporting remuneration:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>{Intl.NumberFormat('sv-SE').format(8904)} SEK</Text>
          </Text>
          <Text style={{ marginBottom: 8 }}>
            C) Surcharge on the reporting fee:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 1 }).format(data?.surcharge as number)} SEK
            </Text>
          </Text>
          <Text style={{ marginBottom: 8 }}>
            D) Change factor with KPI:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(data?.changeFactor as number)}
            </Text>
          </Text>
          <Text style={{ marginBottom: 8 }}>
            E) Change factor littering rate:{' '}
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(data?.changeFactorLitter as number)}
            </Text>
          </Text>
        </View>

        <View style={{ marginTop: 'auto', fontSize: 8 }}>
          <Text>
            If you have any questions, please contact SUP Filter via{' '}
            <Link href="mailto:info@supfilter.se">info@supfilter.se</Link>.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
