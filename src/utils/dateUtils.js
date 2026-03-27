// Returns 1 or 2 based on the day of the month
export function getPhaseFromDate(date = new Date()) {
  const day = date.getDate();
  return day <= 14 ? 1 : 2;
}

// Returns week number 1-4 based on day of month
export function getWeekOfMonth(date = new Date()) {
  const day = date.getDate();
  if (day <= 7) return 1;
  if (day <= 14) return 2;
  if (day <= 21) return 3;
  return 4;
}

// Returns YYYY-MM-DD string
export function toDateString(date = new Date()) {
  return date.toISOString().split('T')[0];
}

// Get start and end of the current week (Mon-Sun) as YYYY-MM-DD
export function getCurrentWeekRange(date = new Date()) {
  const day = date.getDate();
  const week = getWeekOfMonth(date);
  const year = date.getFullYear();
  const month = date.getMonth();

  const weekStarts = [1, 8, 15, 22];
  const weekEnds = [7, 14, 21, getLastDayOfMonth(year, month)];

  const start = new Date(year, month, weekStarts[week - 1]);
  const end = new Date(year, month, weekEnds[week - 1]);

  return { start: toDateString(start), end: toDateString(end) };
}

export function getLastDayOfMonth(year, month) {
  return new Date(year, month + 1, 0).getDate();
}

// Build marked dates object for the calendar
export function buildMarkedDates(date = new Date()) {
  const { start, end } = getCurrentWeekRange(date);
  const today = toDateString(date);
  const marked = {};

  // Fill in the week range
  let current = new Date(start);
  const endDate = new Date(end);
  while (current <= endDate) {
    const key = toDateString(current);
    marked[key] = {
      color: '#7c3aed',
      textColor: '#fff',
      startingDay: key === start,
      endingDay: key === end,
    };
    current.setDate(current.getDate() + 1);
  }

  // Highlight today
  if (marked[today]) {
    marked[today] = { ...marked[today], textColor: '#fbbf24', dotColor: '#fbbf24', marked: true };
  }

  return marked;
}
