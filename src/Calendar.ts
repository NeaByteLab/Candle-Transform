import type * as Types from '@app/Types.ts'

/**
 * Calendar alignment for week and month buckets.
 * @description UTC start-of-week and start-of-month.
 */
export class Calendar {
  /**
   * Start of month (UTC) for timestamp.
   * @description Returns 00:00:00.000 on first day of month in UTC.
   * @param timestamp - Input timestamp in ms
   * @returns Start of that month in ms (UTC)
   */
  static getMonthStart(timestamp: number): number {
    const utcDate = new Date(timestamp)
    return Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), 1)
  }

  /**
   * Start of week (UTC) for timestamp.
   * @description Returns 00:00:00.000 on start day of week in UTC.
   * @param timestamp - Input timestamp in ms
   * @param startDay - Day week starts (0=Sun, 1=Mon, ..., 6=Sat)
   * @returns Start of that week in ms (UTC)
   */
  static getWeekStart(timestamp: number, startDay: Types.CalendarWeekStart): number {
    const utcDate = new Date(timestamp)
    const dayOfWeek = utcDate.getUTCDay() as Types.CalendarWeekStart
    const offset = (dayOfWeek - startDay + 7) % 7
    const dayOfMonth = utcDate.getUTCDate() - offset
    return Date.UTC(utcDate.getUTCFullYear(), utcDate.getUTCMonth(), dayOfMonth)
  }
}
