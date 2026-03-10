import { differenceInCalendarDays, startOfDay, parseISO } from 'date-fns';

/**
 * Calculates the appropriate listening index for the user's local date.
 * 
 * @param startDateStr The global start date in 'YYYY-MM-DD' format from Firestore config.
 * @param totalListenings The total number of available listenings in the database.
 * @returns The expected index (0-based) for today, or -1 if the start date is in the future.
 */
export function getDailyListeningIndex(startDateStr: string, totalListenings: number): number {
  if (totalListenings === 0) return -1;
  const localDate = new Date(); // Local user time exactly as requested
  // Parse the start date strictly as local YYYY-MM-DD to avoid timezone shifting
  // Because if we parse '2026-03-10' using new Date() it might assume UTC.
  // parseISO('2026-03-10') usually sets UTC time if no timezone provided.
  // Instead, let's build the explicit local start date:
  const [year, month, day] = startDateStr.split('-').map(Number);
  const startLocal = new Date(year, month - 1, day); 

  const daysElapsed = differenceInCalendarDays(localDate, startLocal);

  if (daysElapsed < 0) {
    return -1; // "Starts on ..."
  }

  // Calculate the remainder safely for any elapsed time.
  const index = ((daysElapsed % totalListenings) + totalListenings) % totalListenings;
  return index;
}

export function formatLocalDateString(date = new Date()): string {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
