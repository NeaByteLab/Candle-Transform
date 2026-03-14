import { assertEquals, assertThrows } from '@std/assert'
import type * as Types from '@app/Types.ts'
import { Time, Transform } from '@app/index.ts'

function getTimestampUtc(day: number, hour: number, minute: number): number {
  return Date.UTC(2026, 0, day, hour, minute)
}

Deno.test('Candle without volume gets volume 0 in output', () => {
  const inputCandles: Types.CandleData[] = [
    {
      time: getTimestampUtc(1, 10, 0),
      open: 1,
      high: 1,
      low: 1,
      close: 1
    }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1h')
  assertEquals(resultCandles[0]?.volume, 0)
})

Deno.test('Empty input returns empty array', () => {
  assertEquals(Transform.fromCandles([]).toTimeframe('1h'), [])
  assertEquals(Transform.execute([], '4h'), [])
})

Deno.test('Single candle returns single aggregated candle', () => {
  const inputCandles: Types.CandleData[] = [
    {
      time: getTimestampUtc(1, 10, 5),
      open: 100,
      high: 102,
      low: 99,
      close: 101
    }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1h')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(candle.open, 100)
  assertEquals(candle.high, 102)
  assertEquals(candle.low, 99)
  assertEquals(candle.close, 101)
  assertEquals(new Date(candle.time).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
})

Deno.test('Transform.anchor: invalid hour throws', () => {
  const inputCandles: Types.CandleData[] = [
    {
      time: getTimestampUtc(1, 0, 0),
      open: 1,
      high: 1,
      low: 1,
      close: 1
    }
  ]
  assertThrows(
    () => Transform.fromCandles(inputCandles).setAnchorTime(-1).toTimeframe('1h'),
    Error,
    '0 and 23'
  )
  assertThrows(
    () => Transform.fromCandles(inputCandles).setAnchorTime(24).toTimeframe('1h'),
    Error,
    '0 and 23'
  )
})

Deno.test('Transform.anchor: invalid minute throws', () => {
  const inputCandles: Types.CandleData[] = [
    {
      time: getTimestampUtc(1, 0, 0),
      open: 1,
      high: 1,
      low: 1,
      close: 1
    }
  ]
  assertThrows(
    () => Transform.fromCandles(inputCandles).setAnchorTime(12, -1).toTimeframe('1h'),
    Error,
    '0 and 59'
  )
  assertThrows(
    () => Transform.fromCandles(inputCandles).setAnchorTime(12, 60).toTimeframe('1h'),
    Error,
    '0 and 59'
  )
})

Deno.test('Transform.execute with explicit anchor matches fluent API', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 10, 10), open: 1, high: 2, low: 1, close: 2 },
    { time: getTimestampUtc(1, 11, 10), open: 2, high: 3, low: 2, close: 3 }
  ]
  const fromFluent = Transform.fromCandles(inputCandles).setAnchorTime(23).toTimeframe('1h')
  const fromStatic = Transform.execute(inputCandles, '1h', 23)
  assertEquals(fromFluent.length, fromStatic.length)
  assertEquals(fromFluent[0]?.time, fromStatic[0]?.time)
  assertEquals(fromFluent[1]?.time, fromStatic[1]?.time)
})

Deno.test('Transform.execute with options.weekStartDay for 1W', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(8, 12, 0), open: 1, high: 1, low: 1, close: 1 }
  ]
  const resultCandles = Transform.execute(inputCandles, '1W', 23, 0, { weekStartDay: 0 })
  assertEquals(resultCandles.length, 1)
  assertEquals(new Date(resultCandles[0]!.time).toUTCString(), 'Sun, 04 Jan 2026 00:00:00 GMT')
})

Deno.test('Transform.to: invalid timeframe throws', () => {
  const inputCandles: Types.CandleData[] = [
    {
      time: getTimestampUtc(1, 0, 0),
      open: 1,
      high: 1,
      low: 1,
      close: 1
    }
  ]
  assertThrows(
    () => Transform.fromCandles(inputCandles).toTimeframe('2y'),
    Error,
    'Invalid timeframe format'
  )
})

Deno.test('Transform.to with validate throws on invalid data', () => {
  const inputCandles: Types.CandleData[] = [{ time: -1, open: 1, high: 1, low: 1, close: 1 }]
  assertThrows(
    () => Transform.fromCandles(inputCandles).toTimeframe('1h', { validate: true }),
    Error,
    'Validation failed'
  )
})

Deno.test('Transformation: 1m -> 1d spanning two days 2026', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 22, 0), open: 100, high: 101, low: 100, close: 100.5 },
    { time: getTimestampUtc(2, 2, 0), open: 100.5, high: 102, low: 100, close: 101 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setAnchorTime(23).toTimeframe('1d')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Wed, 31 Dec 2025 23:00:00 GMT')
  assertEquals(firstCandle.close, 100.5)
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Thu, 01 Jan 2026 23:00:00 GMT')
  assertEquals(secondCandle.close, 101)
})

Deno.test('Transformation: 1m -> 1h (Standard 00:00 Anchor)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 10, 15), open: 1, high: 2, low: 1, close: 1.5 },
    { time: getTimestampUtc(1, 10, 45), open: 1.5, high: 3, low: 1.5, close: 2.0 },
    { time: getTimestampUtc(1, 11, 5), open: 2.0, high: 2.5, low: 1.8, close: 2.2 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setAnchorTime(23).toTimeframe('1h')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
  assertEquals(firstCandle.high, 3)
  assertEquals(firstCandle.close, 2.0)
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Thu, 01 Jan 2026 11:00:00 GMT')
})

Deno.test('Transformation: 1m -> 4h (Anchor 00:00 UTC)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 2, 59), open: 1, high: 1, low: 1, close: 1 },
    { time: getTimestampUtc(1, 3, 1), open: 2, high: 2, low: 2, close: 2 },
    { time: getTimestampUtc(1, 4, 1), open: 3, high: 3, low: 3, close: 3 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setAnchorTime(0).toTimeframe('4h')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Thu, 01 Jan 2026 00:00:00 GMT')
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Thu, 01 Jan 2026 04:00:00 GMT')
})

Deno.test('Transformation: 1m -> 4h (Anchor 23:00 UTC)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 2, 59), open: 1, high: 1, low: 1, close: 1 },
    { time: getTimestampUtc(1, 3, 1), open: 2, high: 2, low: 2, close: 2 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setAnchorTime(23).toTimeframe('4h')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Wed, 31 Dec 2025 23:00:00 GMT')
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Thu, 01 Jan 2026 03:00:00 GMT')
})

Deno.test('Transformation: 1Mc calendar month', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(5, 0, 0), open: 1, high: 2, low: 1, close: 2 },
    { time: getTimestampUtc(25, 12, 0), open: 2, high: 3, low: 2, close: 3 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1Mc')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(new Date(candle.time).toUTCString(), 'Thu, 01 Jan 2026 00:00:00 GMT')
  assertEquals(candle.close, 3)
})

Deno.test('Transformation: 1Mc February 2026', () => {
  const inputCandles: Types.CandleData[] = [
    { time: Date.UTC(2026, 1, 5, 10, 0), open: 10, high: 11, low: 10, close: 10.5 },
    { time: Date.UTC(2026, 1, 25, 15, 0), open: 10.5, high: 12, low: 10, close: 11 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1Mc')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(new Date(candle.time).toUTCString(), 'Sun, 01 Feb 2026 00:00:00 GMT')
  assertEquals(candle.high, 12)
  assertEquals(candle.close, 11)
})

Deno.test('Transformation: 1W calendar week (Monday start)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(13, 10, 0), open: 1, high: 1, low: 1, close: 1 },
    { time: getTimestampUtc(15, 14, 0), open: 2, high: 2, low: 2, close: 2 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1W')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(new Date(candle.time).toUTCString(), 'Mon, 12 Jan 2026 00:00:00 GMT')
  assertEquals(candle.close, 2)
})

Deno.test('Transformation: 1W with weekStart Sunday (2026)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(4, 10, 0), open: 1, high: 1, low: 1, close: 1 },
    { time: getTimestampUtc(6, 14, 0), open: 2, high: 2, low: 2, close: 2 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setWeekStartDay(0).toTimeframe('1W')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(new Date(candle.time).toUTCString(), 'Sun, 04 Jan 2026 00:00:00 GMT')
  assertEquals(candle.close, 2)
})

Deno.test('Transformation: 1h across midnight Jan 1-2 2026', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 23, 10), open: 1, high: 2, low: 1, close: 1.5 },
    { time: getTimestampUtc(2, 0, 10), open: 1.5, high: 2.5, low: 1.5, close: 2 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1h')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Thu, 01 Jan 2026 23:00:00 GMT')
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Fri, 02 Jan 2026 00:00:00 GMT')
  assertEquals(firstCandle.close, 1.5)
  assertEquals(secondCandle.close, 2)
})

Deno.test('Transformation: Anchor with hour and minute (23:30 UTC)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 23, 35), open: 1, high: 1, low: 1, close: 1 },
    { time: getTimestampUtc(1, 23, 50), open: 2, high: 2, low: 2, close: 2 },
    { time: getTimestampUtc(2, 0, 35), open: 3, high: 3, low: 3, close: 3 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).setAnchorTime(23, 30).toTimeframe('1h')
  assertEquals(resultCandles.length, 2)
  const [firstCandle, secondCandle] = resultCandles
  if (!firstCandle || !secondCandle) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(firstCandle.time).toUTCString(), 'Thu, 01 Jan 2026 23:30:00 GMT')
  assertEquals(firstCandle.close, 2)
  assertEquals(new Date(secondCandle.time).toUTCString(), 'Fri, 02 Jan 2026 00:30:00 GMT')
  assertEquals(secondCandle.close, 3)
})

Deno.test('Transformation: Custom Timeframes (10m, 15m, 45m)', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 10, 5), open: 1, high: 2, low: 1, close: 2 },
    { time: getTimestampUtc(1, 10, 14), open: 2, high: 2, low: 1.5, close: 1.5 },
    { time: getTimestampUtc(1, 10, 25), open: 1.5, high: 3, low: 1.5, close: 3 }
  ]
  const resultCandles10m = Transform.fromCandles(inputCandles).toTimeframe('10m')
  const [firstCandle10m, secondCandle10m, thirdCandle10m] = resultCandles10m
  if (!firstCandle10m || !secondCandle10m || !thirdCandle10m) {
    throw new Error('Missing expected candles (10m)')
  }
  assertEquals(new Date(firstCandle10m.time).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
  assertEquals(new Date(secondCandle10m.time).toUTCString(), 'Thu, 01 Jan 2026 10:10:00 GMT')
  assertEquals(new Date(thirdCandle10m.time).toUTCString(), 'Thu, 01 Jan 2026 10:20:00 GMT')
  const resultCandles45m = Transform.fromCandles(inputCandles).toTimeframe('45m')
  const [firstCandle45m, secondCandle45m] = resultCandles45m
  if (!firstCandle45m || !secondCandle45m) {
    throw new Error('Missing expected candles (45m)')
  }
  assertEquals(new Date(firstCandle45m.time).toUTCString(), 'Thu, 01 Jan 2026 09:30:00 GMT')
  assertEquals(new Date(secondCandle45m.time).toUTCString(), 'Thu, 01 Jan 2026 10:15:00 GMT')
})

Deno.test('Unsorted input produces same result as sorted', () => {
  const sorted: Types.CandleData[] = [
    { time: getTimestampUtc(1, 10, 5), open: 1, high: 2, low: 1, close: 1.5 },
    { time: getTimestampUtc(1, 10, 35), open: 1.5, high: 2.5, low: 1.2, close: 2 }
  ]
  const unsorted: Types.CandleData[] = [sorted[1]!, sorted[0]!]
  const outSorted = Transform.fromCandles(sorted).toTimeframe('1h')
  const outUnsorted = Transform.fromCandles(unsorted).toTimeframe('1h')
  assertEquals(outSorted.length, outUnsorted.length)
  assertEquals(outSorted[0]?.time, outUnsorted[0]?.time)
  assertEquals(outSorted[0]?.high, outUnsorted[0]?.high)
  assertEquals(outSorted[0]?.close, outUnsorted[0]?.close)
})

Deno.test('Volume aggregation in same bucket', () => {
  const inputCandles: Types.CandleData[] = [
    { time: getTimestampUtc(1, 10, 5), open: 1, high: 2, low: 1, close: 1.5, volume: 10 },
    { time: getTimestampUtc(1, 10, 25), open: 1.5, high: 2.5, low: 1.2, close: 2, volume: 20 }
  ]
  const resultCandles = Transform.fromCandles(inputCandles).toTimeframe('1h')
  assertEquals(resultCandles.length, 1)
  const [candle] = resultCandles
  if (!candle) {
    throw new Error('Missing candle')
  }
  assertEquals(candle.volume, 30)
})

Deno.test('alignTime: aligns to bucket start', () => {
  const timestampMs = getTimestampUtc(1, 10, 17)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
})

Deno.test('alignTime: anchor with minute', () => {
  const timestampMs = getTimestampUtc(1, 10, 45)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour, 10, 30)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:30:00 GMT')
})

Deno.test('alignTime: timestamp on bucket boundary unchanged', () => {
  const exactTimestampMs = getTimestampUtc(1, 10, 0)
  const bucketStartMs = Time.alignTime(exactTimestampMs, Time.msPerHour, 23)
  assertEquals(bucketStartMs, exactTimestampMs)
})

Deno.test('defaultAnchorOffset equals 23h in ms', () => {
  assertEquals(Time.defaultAnchorOffset, 23 * Time.msPerHour)
})

Deno.test('parseTimeframe: invalid format throws', () => {
  assertThrows(() => Time.parseTimeframe(''), Error, 'Invalid timeframe format')
  assertThrows(() => Time.parseTimeframe('1'), Error, 'Invalid timeframe format')
  assertThrows(() => Time.parseTimeframe('1x'), Error, 'Invalid timeframe format')
  assertThrows(() => Time.parseTimeframe('m'), Error, 'Invalid timeframe format')
  assertThrows(() => Time.parseTimeframe('1y'), Error, 'Invalid timeframe format')
})

Deno.test('parseTimeframe: valid m, h, d, w, M', () => {
  assertEquals(Time.parseTimeframe('1m'), Time.msPerMinute)
  assertEquals(Time.parseTimeframe('15m'), 15 * Time.msPerMinute)
  assertEquals(Time.parseTimeframe('1h'), Time.msPerHour)
  assertEquals(Time.parseTimeframe('4h'), 4 * Time.msPerHour)
  assertEquals(Time.parseTimeframe('1d'), Time.msPerDay)
  assertEquals(Time.parseTimeframe('2d'), 2 * Time.msPerDay)
  assertEquals(Time.parseTimeframe('1w'), Time.msPerWeek)
  assertEquals(Time.parseTimeframe('2w'), 2 * Time.msPerWeek)
  assertEquals(Time.parseTimeframe('1M'), Time.msPerMonth)
  assertEquals(Time.parseTimeframe('2M'), 2 * Time.msPerMonth)
})
