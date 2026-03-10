/* eslint-disable */
const { test } = require('node:test');
const assert = require('node:assert');
const { differenceInCalendarDays } = require('date-fns');

// Extract the logic exactly as it is in /lib/schedule.ts to test it without Next.js compilation issues
function getDailyListeningIndexLogic(localDate, startDateStr, totalListenings) {
  if (totalListenings === 0) return -1;
  const [year, month, day] = startDateStr.split('-').map(Number);
  const startLocal = new Date(year, month - 1, day); 
  const daysElapsed = differenceInCalendarDays(localDate, startLocal);
  if (daysElapsed < 0) return -1;
  return ((daysElapsed % totalListenings) + totalListenings) % totalListenings;
}

test('getDailyListeningIndexLogic', async (t) => {
  await t.test('returns 0 on the exact start date', () => {
    const localDate = new Date(2026, 2, 10); // March 10, 2026
    const index = getDailyListeningIndexLogic(localDate, '2026-03-10', 5);
    assert.strictEqual(index, 0);
  });

  await t.test('returns -1 if start date is in the future', () => {
    const localDate = new Date(2026, 2, 9); // March 9, 2026
    const index = getDailyListeningIndexLogic(localDate, '2026-03-10', 5);
    assert.strictEqual(index, -1);
  });

  await t.test('wraps around correctly on day 5 (if 5 listenings)', () => {
    const localDate = new Date(2026, 2, 15); // March 15, 2026, 5 days elapsed
    const index = getDailyListeningIndexLogic(localDate, '2026-03-10', 5);
    assert.strictEqual(index, 0);
  });

  await t.test('computes index 1 for day 6', () => {
    const localDate = new Date(2026, 2, 16); // March 16, 2026, 6 days elapsed
    const index = getDailyListeningIndexLogic(localDate, '2026-03-10', 5);
    assert.strictEqual(index, 1);
  });
});
