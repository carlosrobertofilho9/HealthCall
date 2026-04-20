const ISO_DATE_REGEX = /^(\d{4})-(\d{2})-(\d{2})$/;

export const DOCUMENTS_MAX_FUTURE_DAYS = 90;

export const getTodayIsoDate = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseIsoDateLocal = (value: string): Date | null => {
  const match = value.match(ISO_DATE_REGEX);
  if (!match) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

export const toIsoDateLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const isIsoDateWithinFutureRange = (
  isoDate: string,
  maxFutureDays = DOCUMENTS_MAX_FUTURE_DAYS,
): boolean => {
  const date = parseIsoDateLocal(isoDate);
  if (!date) return false;

  const today = parseIsoDateLocal(getTodayIsoDate());
  if (!today) return false;

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxFutureDays);

  return date >= today && date <= maxDate;
};

export const clampIsoDateToFutureRange = (
  isoDate: string,
  maxFutureDays = DOCUMENTS_MAX_FUTURE_DAYS,
): string => {
  const date = parseIsoDateLocal(isoDate);
  const today = parseIsoDateLocal(getTodayIsoDate());

  if (!date || !today) {
    return getTodayIsoDate();
  }

  const maxDate = new Date(today);
  maxDate.setDate(maxDate.getDate() + maxFutureDays);

  if (date < today) {
    return toIsoDateLocal(today);
  }

  if (date > maxDate) {
    return toIsoDateLocal(maxDate);
  }

  return toIsoDateLocal(date);
};

export const addDaysToIsoDate = (isoDate: string, daysToAdd: number): string | null => {
  const date = parseIsoDateLocal(isoDate);
  if (!date) return null;

  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + daysToAdd);
  return toIsoDateLocal(nextDate);
};

export const formatIsoDateToDayMonth = (isoDate?: string): string => {
  if (!isoDate) return '___/___';
  const parsedDate = parseIsoDateLocal(isoDate);
  if (!parsedDate) return '___/___';

  const day = String(parsedDate.getDate()).padStart(2, '0');
  const month = String(parsedDate.getMonth() + 1).padStart(2, '0');
  return `${day}/${month}`;
};

export const buildSequentialDayMonthDates = (
  startIsoDate: string | undefined,
  totalDays: number,
): string[] => {
  if (!startIsoDate) {
    return Array.from({ length: totalDays }, () => '___/___');
  }

  return Array.from({ length: totalDays }, (_, index) => {
    const isoDate = addDaysToIsoDate(startIsoDate, index);
    return formatIsoDateToDayMonth(isoDate ?? undefined);
  });
};