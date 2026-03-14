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
   * Parses timeframe string to ms.
   * @description Converts e.g. 15m, 4h, 1d to milliseconds.
   * @param tf - Timeframe string input
   * @returns Duration in milliseconds
   */
  static parseTimeframe(tf: string): number {
    const match = tf.match(/^(\d+)([mhdwM])$/)
    if (!match || !match[1] || !match[2]) {
      throw new Error(
        `Invalid timeframe format: ${tf}. Use format like '15m', '4h', '1d', '1w', '1M'`
      )
    }
    const numValue = parseInt(match[1], 10)
    const unit = match[2] as 'm' | 'h' | 'd' | 'w' | 'M'
    switch (unit) {
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
        throw new Error(`Unknown time unit: ${unit}`)
    }
  }
}
