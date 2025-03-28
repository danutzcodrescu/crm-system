import { eq } from 'drizzle-orm';
import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

import { db as drizzle } from '~/utils/server/repositories/db.server';
import {
  agreement,
  agreementTypeEnum,
  companies,
  compensationView,
  generalInformation,
  initialConsultation,
  invoicing,
  logs,
  recurringConsultation,
  reporting,
  responsibles,
  status,
  years,
} from '~/utils/server/schema.server';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function formatDate(date: string) {
  if (!date) {
    return undefined;
  }
  const [month, day, year] = date.split('/');
  // @ts-expect-error it works
  return new Date(`20${year}`, month - 1, day);
}

function formatLogDate(date: string) {
  if (!date) {
    return undefined;
  }
  const [day, month] = date.split('/');
  // @ts-expect-error it works
  return new Date(2024, month - 1, day);
}

async function main() {
  try {
    await drizzle
      .insert(years)
      .values([
        { name: 2022 },
        { name: 2023 },
        { name: 2024, changeFactor: 1.0652 },
        { name: 2025 },
        { name: 2026 },
        { name: 2027 },
        { name: 2028 },
        { name: 2029 },
        { name: 2030 },
      ])
      .onConflictDoNothing();
  } catch (e) {
    console.error(e);
  }
  try {
    await drizzle
      .insert(status)
      .values([
        { id: 2, name: 'Ansvarig tjänsteperson identifierad' },
        { id: 3, name: 'Ansvarig tjänsteperson uppringd' },
        {
          id: 4,
          name: 'Ansvarig tjänsteperson återkopplat',
        },
        {
          id: 5,
          name: 'Möte med kommun',
        },
        {
          id: 6,
          name: 'Kommunen avstår avtalstecknande',
        },
        {
          id: 7,
          name: 'Samråd genomfört',
        },
        {
          id: 8,
          name: 'Avtal signerat',
        },
      ])
      .onConflictDoNothing();
  } catch (e) {
    console.error(e);
  }

  let data = {} as Record<string, string>;

  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(companies);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(responsibles);
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(logs);

    const municipalitiesData = readCommunes();
    data = await drizzle
      .insert(companies)
      .values(
        municipalitiesData.map((row) => ({
          statusId: row.statusId,
          name: row.name,
          code: row.code,
          email: row.email,
        })),
      )
      .onConflictDoNothing()
      .returning({ id: companies.id, code: companies.code });
    // @ts-expect-error it works
    data = data.reduce(
      (acc, val) => {
        acc[val.code] = val.id;
        return acc;
      },
      {} as Record<string, string>,
    );
    await drizzle.insert(responsibles).values(
      municipalitiesData
        .flatMap((row) => {
          const responsibles = row?.responsibles?.split('\r\n').map((responsible) => responsible.trim());

          const emails = row?.responsibleEmail?.split('\r\n').map((email) => email.trim());

          const phoneNumber = row?.phoneNumber?.split('\r\n').map((phone) => phone.trim());
          if (responsibles?.length || emails?.length || phoneNumber?.length) {
            // get the longest array not the longest number
            const longest = [responsibles, emails, phoneNumber].reduce(
              (a, b) => (a?.length || 0 > b?.length || 0 ? a : b),
              [],
            );
            return longest.map((_, index) => ({
              companyId: data[row.code],
              name: responsibles?.length && responsibles[index] ? responsibles[index].split(',')[0].trim() : undefined,
              title:
                responsibles?.length && responsibles[index] ? responsibles[index].split(',')[1]?.trim() : undefined,
              email: emails?.length && emails[index] ? emails[index] : undefined,
              phoneNumber: phoneNumber?.length && phoneNumber[index] ? phoneNumber[index] : undefined,
            }));
          }
          return undefined;
        })
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter(Boolean) as any[],
    );

    await drizzle.insert(logs).values(
      municipalitiesData
        .flatMap((row) =>
          row.logs
            ? row.logs.split('\r\n').map((log) => {
                const logData = log.split(' - ');
                if (logData.length === 2) {
                  return {
                    companyId: data[row.code],
                    description: logData[1],
                    date: formatLogDate(logData[0]),
                  };
                } else {
                  return {
                    companyId: data[row.code],
                    description: log,
                    date: new Date(2024, 0, 1),
                  };
                }
              })
            : undefined,
        )
        .filter(Boolean) as { companyId: string; description: string; date: Date }[],
    );
  } catch (e) {
    console.error(e);
  }
  try {
    const consultationSigned = {} as Record<string, number>;
    const consultationData = readInitialConsultation();
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(initialConsultation);
    await drizzle.insert(initialConsultation).values(
      consultationData.map((row) => {
        if (row.dateSigned) {
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const [_, __, year] = row.dateSigned.split('/');
          consultationSigned[data[row.code]] = parseInt(20 + year);
        }
        return {
          companyId: data[row.code],
          documentSent: row.documentSent === 'Yes',
          dateSigned: formatDate(row.dateSigned),
          dateShared: formatDate(row.dateShared),
          link: row.link,
        };
      }),
    );
    await Promise.all(
      Object.entries(consultationSigned).map(([code, year]) =>
        drizzle
          .update(companies)
          .set({ consultations: [year + 1, year + 3, year + 5, year + 7] })
          .where(eq(companies.id, code)),
      ),
    );
  } catch (e) {
    console.error(e);
  }
  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(agreement);
    await drizzle.insert(agreement).values(
      readAgreement().map((row) => {
        return {
          companyId: data[row.code],
          typeOfAgreement:
            row.agreementType === 'Old' ? agreementTypeEnum.enumValues[0] : agreementTypeEnum.enumValues[1],
          oldAgreementSent: row.agreementSent === 'Yes',
          oldAgreementDateSigned: formatDate(row.agreementDate),
          oldAgreementDateShared: formatDate(row.sharedWithAuthorityDate),
          oldAgreementLinkToAgreement: row.link,
          oldAgreementLinkToAppendix: row.appendixLink,
        };
      }),
    );
  } catch (e) {
    console.error(e);
  }

  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(recurringConsultation);
    await drizzle.insert(recurringConsultation).values(
      readRecurringConsultation().map((row) => ({
        companyId: data[row.code],
        year: 2024,
        sentDate: row.dateSent && row.dateSent !== 'N/A' ? formatDate(row.dateSent) : undefined,
        meetingDate:
          row.meetingScheduled && row.meetingScheduled !== 'N/A'
            ? new Date(`${row.meetingScheduled} ${row.meetingTime}`)
            : undefined,
        consultationFormCompleted: row.consultationForm ? row.consultationForm === 'Yes' : undefined,
        meetingHeld: row.meetingHeld && row.meetingHeld === 'Yes' ? true : undefined,
        infoSharedWith: row.infoSharedWith,
        sharedInfoDate: undefined,
      })),
    );
    await drizzle.insert(recurringConsultation).values(
      Object.values(data).reduce(
        (acc, val) => {
          acc.push({ companyId: val, year: 2023 });
          acc.push({ companyId: val, year: 2025 });
          acc.push({ companyId: val, year: 2026 });
          acc.push({ companyId: val, year: 2027 });
          acc.push({ companyId: val, year: 2028 });
          acc.push({ companyId: val, year: 2029 });
          acc.push({ companyId: val, year: 2030 });
          return acc;
        },
        [] as unknown as [{ companyId: string; year: number }],
      ),
    );
  } catch (e) {
    console.error(e);
  }

  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(reporting);
    await drizzle.insert(reporting).values(
      readReporting().map((row) => {
        return {
          companyId: data[row.code],
          year: 2023,
          reportingDate: formatDate(row.reportingDate),
          cigaretteButts: row.cigaretteButs ? parseFloat(row.cigaretteButs) : undefined,
        };
      }),
    );
    await drizzle.insert(reporting).values(
      Object.values(data).reduce(
        (acc, val) => {
          acc.push({ companyId: val, year: 2024 });
          acc.push({ companyId: val, year: 2025 });
          acc.push({ companyId: val, year: 2026 });
          acc.push({ companyId: val, year: 2027 });
          acc.push({ companyId: val, year: 2028 });
          acc.push({ companyId: val, year: 2029 });
          acc.push({ companyId: val, year: 2030 });
          return acc;
        },
        [] as unknown as [{ companyId: string; year: number }],
      ),
    );
  } catch (e) {
    console.error(e);
  }

  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(generalInformation);
    await drizzle.insert(generalInformation).values(
      readGeneralInformation().flatMap((row) => {
        return [
          {
            year: 2022,
            companyId: data[row.code],
            inhabitants: parseInt(row.inhabitants2022.replaceAll(',', '')),
            landSurface: parseFloat(row.surface2022),
            cleaningCost: parseInt(row.cleaningCost2022.replaceAll(',', '')),
            cleanedKg: row.cleaningKg2022 ? parseInt(row.cleaningKg2022.replaceAll(',', '')) : undefined,
            epaLitterMeasurement: row.epaLitterMeasurement2022 === 'Yes' ? true : undefined,
          },
          {
            year: 2023,
            companyId: data[row.code],
            inhabitants: parseInt(row.inhabitants2023.replaceAll(',', '')),
            landSurface: parseFloat(row.surface2023),
            cleaningCost: undefined,
            cleanedKg: undefined,
            epaLitterMeasurement: row.epaLitterMeasurement2023 === 'Yes' ? true : undefined,
          },
          {
            year: 2024,
            companyId: data[row.code],
            inhabitants: parseInt(row.inhabitants2024.replace(',', '')),
            landSurface: parseFloat(row.surface2024),
          },
          { year: 2025, companyId: data[row.code] },
          { year: 2026, companyId: data[row.code] },
          { year: 2027, companyId: data[row.code] },
          { year: 2028, companyId: data[row.code] },
          { year: 2029, companyId: data[row.code] },
          { year: 2030, companyId: data[row.code] },
        ];
      }),
    );
  } catch (e) {
    console.error(e);
  }

  try {
    // eslint-disable-next-line drizzle/enforce-delete-with-where
    await drizzle.delete(invoicing);
    await drizzle.insert(invoicing).values(
      readInvoicing().flatMap((row) => [
        {
          companyId: data[row.code],
          year: 2023,
          invoiceAmount: row.invoiceAmount ? parseInt(row.invoiceAmount.replace(',', '')) : undefined,
          vat: row.vat ? parseInt(row.vat.replaceAll(',', '')) : undefined,
        },
        {
          companyId: data[row.code],
          year: 2024,
        },
        {
          companyId: data[row.code],
          year: 2025,
        },
        {
          companyId: data[row.code],
          year: 2026,
        },
        {
          companyId: data[row.code],
          year: 2027,
        },
        {
          companyId: data[row.code],
          year: 2028,
        },
        {
          companyId: data[row.code],
          year: 2029,
        },
        {
          companyId: data[row.code],
          year: 2030,
        },
      ]),
    );
  } catch (e) {
    console.error(e);
  }
  await drizzle.refreshMaterializedView(compensationView);
  process.exit(0);
}

function readCommunes() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  const rows = xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], {
      header: ['code', 'name', 'status', 'responsible', 'phoneNumber', 'responsibleEmail', 'email', 'logs'],
    })
    .slice(1) as [
    {
      name: string;
      code: string;
      status: string;
      responsible: string;
      phoneNumber: string;
      responsibleEmail: string;
      email: string;
      logs: string;
    },
  ];

  return rows.map((row) => ({
    code: row.code,
    name: row.name.replace(/\skommun$/, ''),
    statusId: parseInt(row.status.substring(0, 1)),
    responsibles: row.responsible,
    phoneNumber: row.phoneNumber,
    responsibleEmail: row.responsibleEmail,
    email: row.email,
    logs: row.logs,
  }));
}

function readInitialConsultation() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'), { cellDates: true });
  const rows = xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], {
      header: [
        'code',
        'municipality',
        'documentSent',
        'documentSigned',
        'dateSigned',
        'sharedWithAuthority',
        'dateShared',
        'link',
      ],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as [
    {
      code: string;
      municipality: string;
      documentSent: string;
      documentSigned: string;
      dateSigned: string;
      sharedWithAuthority: string;
      dateShared: string;
      link: string;
    },
  ];

  return rows;
}

function readAgreement() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'), { cellDates: true });
  return xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[2]], {
      header: [
        'code',
        'agreementType',
        'agreementSent',
        'agreementSigned',
        'agreementDate',
        'sharedWithAuthority',
        'sharedWithAuthorityDate',
        'link',
        'appendixLink',
        'newAgreementSent',
        'newAgreementSigned',
        'newAgreementSignedDate',
        'newAgreementShared',
        'newAgreementSharedDate',
        'newAgreementLink',
      ],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as [
    {
      code: string;
      agreementType: string;
      agreementDate: string;
      agreementSent: string;
      agreementSigned: string;
      sharedWithAuthority: string;
      sharedWithAuthorityDate: string;
      link: string;
      appendixLink: string;
      newAgreementSent: string;
      newAgreementSigned: string;
      newAgreementSignedDate: string;
      newAgreementShared: string;
      newAgreementSharedDate: string;
      newAgreementLink: string;
    },
  ];
}

function readRecurringConsultation() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  return xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[3]], {
      header: [
        'code',
        'dateSent',
        'meetingScheduled',
        'meetingTime',
        'consultationForm',
        'meetingHeld',
        'infoSharedWith',
        'sharedInfoDate',
      ],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as [
    {
      code: string;
      dateSent: string;
      meetingScheduled: string;
      meetingTime: string;
      consultationForm: string;
      meetingHeld: string;
      infoSharedWith: string;
      sharedInfoDate: string;
    },
  ];
}

function readReporting() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  return xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[4]], {
      header: ['code', 'haveReported', 'reportingDate', 'cigaretteButs', 'motivationForData'],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as [
    {
      code: string;
      haveReported: string;
      reportingDate: string;
      cigaretteButs: string;
      motivationForData: string;
    },
  ];
}

function readGeneralInformation() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  return xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[7]], {
      header: [
        'code',
        'inhabitants2022',
        'surface2022',
        'cleaningCost2022',
        'cleaningKg2022',
        'epaLitterMeasurement2022',
        'inhabitants2023',
        'surface2023',
        'cleaningCost2023',
        'cleaningKg2023',
        'epaLitterMeasurement2023',
        'inhabitants2024',
        'surface2024',
      ],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(2) as [
    {
      code: string;
      inhabitants2022: string;
      surface2022: string;
      cleaningCost2022: string;
      cleaningKg2022: string;
      epaLitterMeasurement2022: string;
      inhabitants2023: string;
      surface2023: string;
      cleaningCost2023: string;
      cleaningKg2023: string;
      epaLitterMeasurement2023: string;
      inhabitants2024: string;
      surface2024: string;
    },
  ];
}

function readInvoicing() {
  const workbook = xlsx.readFile(path.resolve(__dirname, './20241205_Master CRM data.xlsx'));
  return xlsx.utils
    .sheet_to_json(workbook.Sheets[workbook.SheetNames[6]], {
      header: ['code', 'invoiceDate', 'datePaid', 'invoiceAmount', 'vat'],
      raw: false,
      dateNF: 'dd/mm/yyyy',
      defval: undefined,
    })
    .slice(1) as [
    {
      code: string;
      invoiceDate: string;
      datePaid: string;
      invoiceAmount: string;
      vat: string;
    },
  ];
}

main();
