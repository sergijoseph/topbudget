import { RRule } from 'rrule';

export function getNextDate(date, type) {
  const current = new Date(date);

  switch (type) {
    case 'WEEKLY': {
      return new RRule({
        freq: RRule.WEEKLY,
        dtstart: current,
      }).after(current, false).toISOString().split("T")[0]; // false = exclude current date
    }

    case 'MONTHLY-SD': {
      return new RRule({
        freq: RRule.MONTHLY,
        dtstart: current,
      }).after(current, false).toISOString().split("T")[0];
    }

    case 'MONTHLY-EOM': {
      return new RRule({
        freq: RRule.MONTHLY,
        bymonthday: -1,
        dtstart: current,
      }).after(current, false).toISOString().split("T")[0];
    }

    default:
      throw new Error('Unknown recurrence type');
  }
}
