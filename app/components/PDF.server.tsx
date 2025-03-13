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
          <Text style={{ fontSize: 20, marginBottom: 12 }}>Specificerad ersättning för insamling av fimpar</Text>
          <Text style={{ fontSize: 20, marginBottom: 24 }}>
            {data.companyName} år {data.year}
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ marginBottom: 24, textAlign: 'justify' }}>
            Enligt avtal med SUP Filter är er kommun berättigad till årlig ersättning för insamling av fimpar. I
            avtalets kapitel 8 och bilaga 8.1 framgår vilka ersättningsbelopp som gäller, hur de justeras varje år och
            vilka faktorer de grundas på. Information om betalningsvillkor och fakturering återfinns i bilaga 8.2.
          </Text>
        </View>

        <View style={{ marginBottom: 32 }}>
          <Text style={{ marginBottom: 12 }}>
            Total ersättning:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE').format(data?.total as number)} kronor
            </Text>
            &nbsp; (A + B + C) x (D)
          </Text>
        </View>

        <View>
          <Text style={{ marginBottom: 8 }}>
            A) Rörlig ersättning:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE').format(data?.variableCompensation as number)} kronor
            </Text>
            &nbsp;(&nbsp;{Intl.NumberFormat('sv-SE', { minimumFractionDigits: 15 }).format(data.yearSekAdmin)} SEK x
            &nbsp;
            {Intl.NumberFormat('sv-SE').format(data.inhabitants as number)}&nbsp;inhabitants&nbsp;)
          </Text>
          <Text style={{ marginBottom: 8 }}>
            B) Rapporteringsersättning:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE').format(data.adminFee)} kronor
            </Text>
          </Text>
          <Text style={{ marginBottom: 8 }}>
            C) Påslag på rapporteringsersättningen:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 1 }).format(data.surcharge as number)} kronor
            </Text>
          </Text>
          <Text style={{ marginBottom: 8 }}>
            D) Förändringsfaktor med KPI:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(data?.changeFactor as number)}
            </Text>
          </Text>
          {/* <Text style={{ marginBottom: 8 }}>
            E) Change factor littering rate:&nbsp;
            <Text style={{ fontFamily: 'Helvetica-Bold' }}>
              {Intl.NumberFormat('sv-SE', { minimumFractionDigits: 6 }).format(data?.changeFactorLitter as number)}
            </Text>
          </Text> */}
        </View>

        <View style={{ marginTop: 'auto', fontSize: 8 }}>
          <Text>
            Vid eventuella frågor vänligen kontakta SUP Filter via&nbsp;
            <Link href="mailto:info@supfilter.se">info@supfilter.se</Link>.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
