import type { CandleData, TimeframeStr } from '@app/Types.ts'
import { getCandleOpenTime, parseTimeframe } from '@app/Time.ts'

/**
 * Static class for batching.
 * @description Processes multiple candles efficiently.
 */
export class BatchTransform {
  /**
   * Executes batch transformation.
   * @param candles - Source data array
   * @param timeframe - Target timeframe string
   * @param anchorHour - Alignment anchor hour
   * @returns Transformed candle array
   */
  static execute(candles: CandleData[], timeframe: TimeframeStr, anchorHour = 23): CandleData[] {
    if (candles.length === 0) {
      return []
    }
    const intervalMs = parseTimeframe(timeframe)
    const results: CandleData[] = []
    let currentCandle: CandleData | null = null
    const sortedCandles = [...candles].sort((a, b) => a.time - b.time)
    for (const candle of sortedCandles) {
      const bucketStart = getCandleOpenTime(candle.time, intervalMs, anchorHour)
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
}

/**
 * Fluent interface for transform.
 * @description Builder pattern for easy use.
 */
export class Transform {
  /** Source candles data */
  private sourceData: CandleData[]
  /** Anchor hour offset */
  private anchorHour = 23

  /**
   * Creates transform instance.
   * @description Initializes with source data.
   */
  constructor(data: CandleData[]) {
    this.sourceData = data
  }

  /**
   * Sets the anchor hour.
   * @param hour - Hour between 0-23
   * @returns Current instance
   */
  anchor(hour: number): this {
    if (hour < 0 || hour > 23) {
      throw new Error('Anchor hour must be between 0 and 23')
    }
    this.anchorHour = hour
    return this
  }

  /**
   * Static factory method.
   * @param data - Input candle data
   * @returns New Transform instance
   */
  static from(data: CandleData[]): Transform {
    return new Transform(data)
  }

  /**
   * Executes the transformation.
   * @param timeframe - Target timeframe string
   * @returns Resulting candle array
   */
  to(timeframe: TimeframeStr): CandleData[] {
    return BatchTransform.execute(this.sourceData, timeframe, this.anchorHour)
  }
}
