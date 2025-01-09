import { TZDate } from '@date-fns/tz';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

export function formatDate(date: string, formatString = 'P') {
  if (!date) return '';

  const d = new TZDate(date, 'Europe/Stockholm');
  return format(d, formatString, { locale: sv });
}
