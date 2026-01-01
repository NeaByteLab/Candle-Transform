/** Milliseconds per minute */
const msPerMinute = 60 * 1000
/** Milliseconds per hour */
const msPerHour = 60 * msPerMinute
/** Milliseconds per day */
const msPerDay = 24 * msPerHour

/**
 * Default anchor offset.
 * @description Default 23h offset in ms.
 */
export const defaultAnchorOffset = 23 * msPerHour

/**
 * Aligns timestamp to anchor.
 * @param timestamp - Input timestamp to align
 * @param intervalMs - Interval duration in ms
 * @param anchorHour - Hour offset for alignment
 * @returns Aligned start timestamp
 */
export function getCandleOpenTime(timestamp: number, intervalMs: number, anchorHour = 23): number {
  const refTime = (anchorHour - 24) * msPerHour
  const delta = timestamp - refTime
  const remainder = delta % intervalMs
  return timestamp - remainder
}

/**
 * Parses timeframe string.
 * @param tf - Timeframe string input
 * @returns Duration in milliseconds
 */
export function parseTimeframe(tf: string): number {
  const match = tf.match(/^(\d+)([mhd])$/)
  if (!match || !match[1] || !match[2]) {
    throw new Error(`Invalid timeframe format: ${tf}. Use format like '15m', '4h', '1d'`)
  }
  const value = parseInt(match[1], 10)
  const unit = match[2] as 'm' | 'h' | 'd'
  switch (unit) {
    case 'm':
      return value * msPerMinute
    case 'h':
      return value * msPerHour
    case 'd':
      return value * msPerDay
    default:
      throw new Error(`Unknown time unit: ${unit}`)
  }
}
