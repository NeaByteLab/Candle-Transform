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
 * @description Example usage like 1m, 1h. Use 1W calendar week, 1Mc calendar month.
 */
export type TimeframeStr = string

/**
 * Week start for calendar week (0=Sun, 1=Mon, ..., 6=Sat).
 * @description Day of week for start-of-week alignment.
 */
export type CalendarWeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6

/** Validation result with valid flag and error messages. */
export type ValidationResult = {
  /** True when no errors */
  valid: boolean
  /** Error messages when invalid */
  errors: string[]
}

/** Options for candle input validation. */
export type ValidateOptions = {
  /** Allow duplicate timestamps. Default false. */
  allowDuplicates?: boolean
  /** Allow unordered time. Default false. */
  allowUnordered?: boolean
  /** Validate OHLC (high >= low, etc). Default false. */
  strictOHLC?: boolean
}
