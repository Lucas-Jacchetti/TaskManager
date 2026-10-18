function toUtc(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: string, days: number): string {
  const result = toUtc(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}

export function getDayOfWeek(date: string): number {
  return toUtc(date).getUTCDay();
}

export function getWeekStart(date: string): string {
  return addDays(date, -((getDayOfWeek(date) + 6) % 7));
}

export function today(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${month}-${day}`;
}

export function dayMonth(date: string): string {
  return `${date.slice(8, 10)}/${date.slice(5, 7)}`;
}

export function formatWeekRange(weekStart: string): string {
  return `${dayMonth(weekStart)} – ${dayMonth(addDays(weekStart, 6))}`;
}