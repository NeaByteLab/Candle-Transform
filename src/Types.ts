/**
 * Interface for OHLCV data.
 * @description Structure representing a single candle.
 */
export interface CandleData {
  /** Timestamp in milliseconds */
  time: number
  /** Opening price */
  open: number
  /** Highest price */
  high: number
  /** Lowest price */
  low: number
  /** Closing price */
  close: number
  /** Trading volume */
  volume?: number
}

/**
 * Allowed time units.
 * @description Timeframe parse units; M is 30-day period.
 */
export type TimeUnit = 'm' | 'h' | 'd' | 'w' | 'M'

/**
 * String format for timeframe.
 * @description Example usage like 1m, 1h.
 */
export type TimeframeStr = string
