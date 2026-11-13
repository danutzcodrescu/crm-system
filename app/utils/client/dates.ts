import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export function formatDate(date: string | Date, formatString = 'P') {
  if (!date) return '';

  const d = new TZDate(new Date(date).getTime(), 'Europe/Stockholm');
  return format(d, formatString, { locale: sv });
}
