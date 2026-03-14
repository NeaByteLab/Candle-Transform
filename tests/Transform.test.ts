import { assertEquals, assertThrows } from '@std/assert'
import { type CandleData, Time, Transform } from '@app/index.ts'

function getTs(d: number, h: number, m: number): number {
  return Date.UTC(2025, 0, d, h, m)
}

Deno.test('alignTime: aligns to bucket start', () => {
  const ts = getTs(1, 10, 17)
  const bucket = Time.alignTime(ts, Time.msPerHour, 23)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
})

Deno.test('alignTime: anchor with minute', () => {
  const ts = getTs(1, 10, 45)
  const bucket = Time.alignTime(ts, Time.msPerHour, 10, 30)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:30:00 GMT')
})

Deno.test('alignTime: timestamp on bucket boundary unchanged', () => {
  const exact = getTs(1, 10, 0)
  const bucket = Time.alignTime(exact, Time.msPerHour, 23)
  assertEquals(bucket, exact)
})

Deno.test('Candle without volume gets volume 0 in output', () => {
  const data: CandleData[] = [{ time: getTs(1, 10, 0), open: 1, high: 1, low: 1, close: 1 }]
  const tf = Transform.from(data).to('1h')
  assertEquals(tf[0]?.volume, 0)
})

Deno.test('defaultAnchorOffset equals 23h in ms', () => {
  assertEquals(Time.defaultAnchorOffset, 23 * Time.msPerHour)
})

Deno.test('Empty input returns empty array', () => {
  assertEquals(Transform.from([]).to('1h'), [])
  assertEquals(Transform.execute([], '4h'), [])
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

Deno.test('Single candle returns single aggregated candle', () => {
  const data: CandleData[] = [{ time: getTs(1, 10, 5), open: 100, high: 102, low: 99, close: 101 }]
  const tf = Transform.from(data).to('1h')
  assertEquals(tf.length, 1)
  const [c] = tf
  if (!c) {
    throw new Error('Missing candle')
  }
  assertEquals(c.open, 100)
  assertEquals(c.high, 102)
  assertEquals(c.low, 99)
  assertEquals(c.close, 101)
  assertEquals(new Date(c.time).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
})

Deno.test('Transform.anchor: invalid hour throws', () => {
  const data: CandleData[] = [{ time: getTs(1, 0, 0), open: 1, high: 1, low: 1, close: 1 }]
  assertThrows(() => Transform.from(data).anchor(-1).to('1h'), Error, '0 and 23')
  assertThrows(() => Transform.from(data).anchor(24).to('1h'), Error, '0 and 23')
})

Deno.test('Transform.anchor: invalid minute throws', () => {
  const data: CandleData[] = [{ time: getTs(1, 0, 0), open: 1, high: 1, low: 1, close: 1 }]
  assertThrows(() => Transform.from(data).anchor(12, -1).to('1h'), Error, '0 and 59')
  assertThrows(() => Transform.from(data).anchor(12, 60).to('1h'), Error, '0 and 59')
})

Deno.test('Transform.execute with explicit anchor matches fluent API', () => {
  const data: CandleData[] = [
    { time: getTs(1, 10, 10), open: 1, high: 2, low: 1, close: 2 },
    { time: getTs(1, 11, 10), open: 2, high: 3, low: 2, close: 3 }
  ]
  const fromFluent = Transform.from(data).anchor(23).to('1h')
  const fromStatic = Transform.execute(data, '1h', 23)
  assertEquals(fromFluent.length, fromStatic.length)
  assertEquals(fromFluent[0]?.time, fromStatic[0]?.time)
  assertEquals(fromFluent[1]?.time, fromStatic[1]?.time)
})

Deno.test('Transform.to: invalid timeframe throws', () => {
  const data: CandleData[] = [{ time: getTs(1, 0, 0), open: 1, high: 1, low: 1, close: 1 }]
  assertThrows(() => Transform.from(data).to('2y'), Error, 'Invalid timeframe format')
})

Deno.test('Transformation: 1m -> 1h (Standard 00:00 Anchor)', () => {
  const data: CandleData[] = [
    { time: getTs(1, 10, 15), open: 1, high: 2, low: 1, close: 1.5 },
    { time: getTs(1, 10, 45), open: 1.5, high: 3, low: 1.5, close: 2.0 },
    { time: getTs(1, 11, 5), open: 2.0, high: 2.5, low: 1.8, close: 2.2 }
  ]
  const tf = Transform.from(data).anchor(23).to('1h')
  assertEquals(tf.length, 2)
  const [c1, c2] = tf
  if (!c1 || !c2) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(c1.time).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
  assertEquals(c1.high, 3)
  assertEquals(c1.close, 2.0)
  assertEquals(new Date(c2.time).toUTCString(), 'Wed, 01 Jan 2025 11:00:00 GMT')
})

Deno.test('Transformation: 1m -> 4h (Anchor 00:00 UTC)', () => {
  const data: CandleData[] = [
    { time: getTs(1, 2, 59), open: 1, high: 1, low: 1, close: 1 },
    { time: getTs(1, 3, 1), open: 2, high: 2, low: 2, close: 2 },
    { time: getTs(1, 4, 1), open: 3, high: 3, low: 3, close: 3 }
  ]
  const tf = Transform.from(data).anchor(0).to('4h')
  assertEquals(tf.length, 2)
  const [c1, c2] = tf
  if (!c1 || !c2) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(c1.time).toUTCString(), 'Wed, 01 Jan 2025 00:00:00 GMT')
  assertEquals(new Date(c2.time).toUTCString(), 'Wed, 01 Jan 2025 04:00:00 GMT')
})

Deno.test('Transformation: 1m -> 4h (Anchor 23:00 UTC)', () => {
  const data: CandleData[] = [
    { time: getTs(1, 2, 59), open: 1, high: 1, low: 1, close: 1 },
    { time: getTs(1, 3, 1), open: 2, high: 2, low: 2, close: 2 }
  ]
  const tf = Transform.from(data).anchor(23).to('4h')
  assertEquals(tf.length, 2)
  const [c1, c2] = tf
  if (!c1 || !c2) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(c1.time).toUTCString(), 'Tue, 31 Dec 2024 23:00:00 GMT')
  assertEquals(new Date(c2.time).toUTCString(), 'Wed, 01 Jan 2025 03:00:00 GMT')
})

Deno.test('Transformation: Anchor with hour and minute (23:30 UTC)', () => {
  const data: CandleData[] = [
    { time: getTs(1, 23, 35), open: 1, high: 1, low: 1, close: 1 },
    { time: getTs(1, 23, 50), open: 2, high: 2, low: 2, close: 2 },
    { time: getTs(2, 0, 35), open: 3, high: 3, low: 3, close: 3 }
  ]
  const tf = Transform.from(data).anchor(23, 30).to('1h')
  assertEquals(tf.length, 2)
  const [c1, c2] = tf
  if (!c1 || !c2) {
    throw new Error('Missing expected candles')
  }
  assertEquals(new Date(c1.time).toUTCString(), 'Wed, 01 Jan 2025 23:30:00 GMT')
  assertEquals(c1.close, 2)
  assertEquals(new Date(c2.time).toUTCString(), 'Thu, 02 Jan 2025 00:30:00 GMT')
  assertEquals(c2.close, 3)
})

Deno.test('Transformation: Custom Timeframes (10m, 15m, 45m)', () => {
  const data: CandleData[] = [
    { time: getTs(1, 10, 5), open: 1, high: 2, low: 1, close: 2 },
    { time: getTs(1, 10, 14), open: 2, high: 2, low: 1.5, close: 1.5 },
    { time: getTs(1, 10, 25), open: 1.5, high: 3, low: 1.5, close: 3 }
  ]
  const tf10m = Transform.from(data).to('10m')
  const [t1, t2, t3] = tf10m
  if (!t1 || !t2 || !t3) {
    throw new Error('Missing expected candles (10m)')
  }
  assertEquals(new Date(t1.time).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
  assertEquals(new Date(t2.time).toUTCString(), 'Wed, 01 Jan 2025 10:10:00 GMT')
  assertEquals(new Date(t3.time).toUTCString(), 'Wed, 01 Jan 2025 10:20:00 GMT')
  const tf45m = Transform.from(data).to('45m')
  const [f1, f2] = tf45m
  if (!f1 || !f2) {
    throw new Error('Missing expected candles (45m)')
  }
  assertEquals(new Date(f1.time).toUTCString(), 'Wed, 01 Jan 2025 09:30:00 GMT')
  assertEquals(new Date(f2.time).toUTCString(), 'Wed, 01 Jan 2025 10:15:00 GMT')
})

Deno.test('Unsorted input produces same result as sorted', () => {
  const sorted: CandleData[] = [
    { time: getTs(1, 10, 5), open: 1, high: 2, low: 1, close: 1.5 },
    { time: getTs(1, 10, 35), open: 1.5, high: 2.5, low: 1.2, close: 2 }
  ]
  const unsorted: CandleData[] = [sorted[1]!, sorted[0]!]
  const outSorted = Transform.from(sorted).to('1h')
  const outUnsorted = Transform.from(unsorted).to('1h')
  assertEquals(outSorted.length, outUnsorted.length)
  assertEquals(outSorted[0]?.time, outUnsorted[0]?.time)
  assertEquals(outSorted[0]?.high, outUnsorted[0]?.high)
  assertEquals(outSorted[0]?.close, outUnsorted[0]?.close)
})

Deno.test('Volume aggregation in same bucket', () => {
  const data: CandleData[] = [
    { time: getTs(1, 10, 5), open: 1, high: 2, low: 1, close: 1.5, volume: 10 },
    { time: getTs(1, 10, 25), open: 1.5, high: 2.5, low: 1.2, close: 2, volume: 20 }
  ]
  const tf = Transform.from(data).to('1h')
  assertEquals(tf.length, 1)
  const [c] = tf
  if (!c) {
    throw new Error('Missing candle')
  }
  assertEquals(c.volume, 30)
})
