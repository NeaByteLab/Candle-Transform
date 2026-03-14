import type * as Types from '@app/Types.ts'

/**
 * Candle input validation.
 * @description Checks time, OHLC, duplicates, and order.
 */
export class Validator {
  /**
   * Validates candle array.
   * @description Returns valid flag and error list.
   * @param candles - Candle array to validate
   * @param options - Validation options
   * @returns Validation result
   */
  static validateCandles(
    candles: Types.CandleData[],
    options: Types.ValidateOptions = {}
  ): Types.ValidationResult {
    const errors: string[] = []
    const allowDuplicates = options.allowDuplicates ?? false
    const allowUnordered = options.allowUnordered ?? false
    const strictOHLC = options.strictOHLC ?? false
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i]!
      if (typeof candle.time !== 'number' || !Number.isFinite(candle.time)) {
        errors.push(`[${i}] time must be a finite number`)
      } else if (candle.time < 0) {
        errors.push(`[${i}] time must be non-negative`)
      }
      const priceKeys = ['open', 'high', 'low', 'close'] as const
      for (const key of priceKeys) {
        const priceValue = candle[key]
        if (typeof priceValue !== 'number' || !Number.isFinite(priceValue)) {
          errors.push(`[${i}] ${key} must be a finite number`)
        }
      }
      if (strictOHLC && Number.isFinite(candle.high) && Number.isFinite(candle.low)) {
        if (candle.high < candle.low) {
          errors.push(`[${i}] high must be >= low`)
        }
      }
      if (typeof candle.volume !== 'undefined' && candle.volume !== null) {
        if (
          typeof candle.volume !== 'number' || !Number.isFinite(candle.volume) || candle.volume < 0
        ) {
          errors.push(`[${i}] volume must be non-negative finite number`)
        }
      }
    }
    if (!allowDuplicates && candles.length > 1) {
      const times = candles.map((c) => c.time)
      const seenTimestamps = new Set<number>()
      for (let i = 0; i < times.length; i++) {
        const candleTime = times[i]!
        if (seenTimestamps.has(candleTime)) {
          errors.push(`Duplicate time ${candleTime} at index ${i}`)
        }
        seenTimestamps.add(candleTime)
      }
    }
    if (!allowUnordered && candles.length > 1) {
      for (let i = 1; i < candles.length; i++) {
        if (candles[i]!.time < candles[i - 1]!.time) {
          errors.push(`Unordered time at index ${i}: ${candles[i]!.time} < ${candles[i - 1]!.time}`)
          break
        }
      }
    }
    return {
      valid: errors.length === 0,
      errors
    }
  }
}
