import type * as Types from '@app/Types.ts'
import { Calendar } from '@app/Calendar.ts'

/**
 * Time constants and alignment helpers.
 * @description Millisecond units and timeframe parsing for buckets.
 */
export class Time {
  /** Milliseconds per minute */
  static readonly msPerMinute = 60 * 1000
  /** Milliseconds per hour */
  static readonly msPerHour = 60 * Time.msPerMinute
  /** Milliseconds per day */
  static readonly msPerDay = 24 * Time.msPerHour
  /** Milliseconds per week */
  static readonly msPerWeek = 7 * Time.msPerDay
  /** Milliseconds per month (30 days) */
  static readonly msPerMonth = 30 * Time.msPerDay
  /** Default anchor offset in ms (23h) */
  static readonly defaultAnchorOffset = 23 * Time.msPerHour

  /**
   * Aligns timestamp to bucket open.
   * @description Snaps time to interval grid from UTC anchor.
   * @param timestamp - Input timestamp to align
   * @param intervalMs - Interval duration in ms
   * @param anchorHour - Hour for alignment (0-23)
   * @param anchorMinute - Minute for alignment (0-59), default 0
   * @returns Aligned start timestamp
   */
  static alignTime(
    timestamp: number,
    intervalMs: number,
    anchorHour = 23,
    anchorMinute = 0
  ): number {
    const anchorOffsetMs = anchorHour * Time.msPerHour + anchorMinute * Time.msPerMinute
    const gridStartMs = anchorOffsetMs - Time.msPerDay
    const elapsedMs = timestamp - gridStartMs
    const intervalOffsetMs = elapsedMs % intervalMs
    return timestamp - intervalOffsetMs
  }

  /**
   * Bucket start for any timeframe (fixed or calendar).
   * @description Uses calendar for 1W/1Mc, else fixed grid.
   * @param timestamp - Input timestamp in ms
   * @param timeframe - e.g. 4h, 1d, 1W (calendar week), 1Mc (calendar month)
   * @param anchorHour - Anchor hour (0-23), used for fixed only
   * @param anchorMinute - Anchor minute (0-59), used for fixed only
   * @param weekStartDay - Week start (0-6) for 1W, default 1 (Monday)
   * @returns Bucket start timestamp in ms
   */
  static getBucketStart(
    timestamp: number,
    timeframe: string,
    anchorHour = 23,
    anchorMinute = 0,
    weekStartDay: Types.CalendarWeekStart = 1
  ): number {
    if (timeframe === '1W') {
      return Calendar.getWeekStart(timestamp, weekStartDay)
    }
    if (timeframe === '1Mc') {
      return Calendar.getMonthStart(timestamp)
    }
    const intervalMs = Time.parseTimeframe(timeframe)
    return Time.alignTime(timestamp, intervalMs, anchorHour, anchorMinute)
  }

  /**
   * Parses timeframe string to ms.
   * @description Converts e.g. 15m, 4h, 1d to milliseconds.
   * @param timeframeStr - Timeframe string input
   * @returns Duration in milliseconds
   */
  static parseTimeframe(timeframeStr: string): number {
    if (timeframeStr === '1W' || timeframeStr === '1Mc') {
      throw new Error(
        `Use Time.getBucketStart for calendar timeframes 1W, 1Mc. parseTimeframe is for fixed intervals only.`
      )
    }
    const match = timeframeStr.match(/^(\d+)([mhdwM])$/)
    if (!match || !match[1] || !match[2]) {
      throw new Error(
        `Invalid timeframe format: ${timeframeStr}. Use format like '15m', '4h', '1d', '1w', '1M', '1W', '1Mc'`
      )
    }
    const numValue = parseInt(match[1], 10)
    const timeUnit = match[2] as 'm' | 'h' | 'd' | 'w' | 'M'
    switch (timeUnit) {
      case 'm':
        return numValue * Time.msPerMinute
      case 'h':
        return numValue * Time.msPerHour
      case 'd':
        return numValue * Time.msPerDay
      case 'w':
        return numValue * Time.msPerWeek
      case 'M':
        return numValue * Time.msPerMonth
      default:
        throw new Error(`Unknown time unit: ${timeUnit}`)
    }
  }
}
