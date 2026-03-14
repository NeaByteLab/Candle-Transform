import type * as Types from '@app/Types.ts'
import { Time } from '@app/Time.ts'
import { Validator } from '@app/Validator.ts'

/**
 * OHLC timeframe transform with anchor alignment.
 * @description Fluent and static API for aggregating candles.
 */
export class Transform {
  /** Anchor hour (0-23) */
  private anchorHour = 23
  /** Anchor minute (0-59) */
  private anchorMinute = 0
  /** Source candles data */
  private sourceData: Types.CandleData[]
  /** Week start for 1W (0-6), default 1 (Monday) */
  private weekStartDay: Types.CalendarWeekStart = 1

  /**
   * Sets anchor time (hour and optional minute).
   * @description Configures UTC anchor for bucket alignment.
   * @param hour - Hour between 0-23
   * @param minute - Minute between 0-59, default 0
   * @returns Current instance
   */
  setAnchorTime(hour: number, minute = 0): this {
    if (hour < 0 || hour > 23) {
      throw new Error('Anchor hour must be between 0 and 23')
    }
    if (minute < 0 || minute > 59) {
      throw new Error('Anchor minute must be between 0 and 59')
    }
    this.anchorHour = hour
    this.anchorMinute = minute
    return this
  }

  /**
   * Creates transform instance.
   * @description Initializes with source candle data.
   * @param data - Input candle array
   */
  constructor(data: Types.CandleData[]) {
    this.sourceData = data
  }

  /**
   * Runs batch transformation.
   * @description Aggregates candles to target timeframe and anchor.
   * @param candles - Source data array
   * @param timeframe - Target timeframe (e.g. 4h, 1d, 1W, 1Mc)
   * @param anchorHour - Alignment anchor hour (0-23)
   * @param anchorMinute - Alignment anchor minute (0-59), default 0
   * @param options - Optional: weekStartDay (for 1W), validate
   * @returns Transformed candle array
   */
  static execute(
    candles: Types.CandleData[],
    timeframe: Types.TimeframeStr,
    anchorHour = 23,
    anchorMinute = 0,
    options?: { weekStartDay?: Types.CalendarWeekStart; validate?: boolean }
  ): Types.CandleData[] {
    if (candles.length === 0) {
      return []
    }
    if (options?.validate) {
      const result = Validator.validateCandles(candles, { allowUnordered: true })
      if (!result.valid) {
        throw new Error(`Validation failed: ${result.errors.join('; ')}`)
      }
    }
    const weekStart = options?.weekStartDay ?? 1
    const results: Types.CandleData[] = []
    let currentCandle: Types.CandleData | null = null
    const sortedCandles = [...candles].sort((a, b) => a.time - b.time)
    for (const candle of sortedCandles) {
      const bucketStart = Time.getBucketStart(
        candle.time,
        timeframe,
        anchorHour,
        anchorMinute,
        weekStart
      )
      if (!currentCandle) {
        currentCandle = {
          time: bucketStart,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        }
        continue
      }
      if (bucketStart === currentCandle.time) {
        currentCandle.high = Math.max(currentCandle.high, candle.high)
        currentCandle.low = Math.min(currentCandle.low, candle.low)
        currentCandle.close = candle.close
        if (typeof candle.volume === 'number') {
          currentCandle.volume = (currentCandle.volume || 0) + candle.volume
        }
      } else {
        results.push(currentCandle)
        currentCandle = {
          time: bucketStart,
          open: candle.open,
          high: candle.high,
          low: candle.low,
          close: candle.close,
          volume: candle.volume || 0
        }
      }
    }
    if (currentCandle) {
      results.push(currentCandle)
    }
    return results
  }

  /**
   * Creates transform instance from data.
   * @description Entry point for fluent chain.
   * @param data - Input candle array
   * @returns New Transform instance
   */
  static fromCandles(data: Types.CandleData[]): Transform {
    return new Transform(data)
  }

  /**
   * Sets week start day for 1W (calendar week).
   * @description 0=Sun, 1=Mon, etc. Default 1.
   * @param weekStartDay - Day of week (0-6)
   * @returns Current instance
   */
  setWeekStartDay(weekStartDay: Types.CalendarWeekStart): this {
    this.weekStartDay = weekStartDay
    return this
  }

  /**
   * Runs transformation and returns candles.
   * @description Aggregates to target timeframe with current anchor.
   * @param timeframe - Target timeframe string (e.g. 4h, 1W, 1Mc)
   * @param options - Optional: validate
   * @returns Resulting candle array
   */
  toTimeframe(timeframe: Types.TimeframeStr, options?: { validate?: boolean }): Types.CandleData[] {
    return Transform.execute(this.sourceData, timeframe, this.anchorHour, this.anchorMinute, {
      weekStartDay: this.weekStartDay,
      ...(options?.validate !== undefined ? { validate: options.validate } : {})
    })
  }
}
