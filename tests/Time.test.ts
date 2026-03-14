import { assertEquals, assertThrows } from '@std/assert'
import { Time } from '@app/Time.ts'

function getTimestampUtc(day: number, hour: number, minute: number): number {
  return Date.UTC(2026, 0, day, hour, minute)
}

Deno.test('Time: defaultAnchorOffset equals 23h in ms', () => {
  assertEquals(Time.defaultAnchorOffset, 23 * Time.msPerHour)
})

Deno.test('Time: msPerDay equals 24 * msPerHour', () => {
  assertEquals(Time.msPerDay, 24 * Time.msPerHour)
})

Deno.test('Time: msPerHour equals 60 * msPerMinute', () => {
  assertEquals(Time.msPerHour, 60 * Time.msPerMinute)
})

Deno.test('Time: msPerMinute equals 60_000', () => {
  assertEquals(Time.msPerMinute, 60 * 1000)
})

Deno.test('Time: msPerMonth equals 30 * msPerDay', () => {
  assertEquals(Time.msPerMonth, 30 * Time.msPerDay)
})

Deno.test('Time: msPerWeek equals 7 * msPerDay', () => {
  assertEquals(Time.msPerWeek, 7 * Time.msPerDay)
})

Deno.test('Time.alignTime: 15m interval aligns to 15m grid', () => {
  const timestampMs = getTimestampUtc(1, 10, 22)
  const intervalMs = Time.parseTimeframe('15m')
  const bucketStartMs = Time.alignTime(timestampMs, intervalMs, 0)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:15:00 GMT')
})

Deno.test('Time.alignTime: 1d interval anchor 00:00', () => {
  const timestampMs = getTimestampUtc(1, 14, 30)
  const intervalMs = Time.parseTimeframe('1d')
  const bucketStartMs = Time.alignTime(timestampMs, intervalMs, 0)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 00:00:00 GMT')
})

Deno.test('Time.alignTime: 1d interval anchor 23', () => {
  const timestampMs = getTimestampUtc(2, 10, 0)
  const intervalMs = Time.parseTimeframe('1d')
  const bucketStartMs = Time.alignTime(timestampMs, intervalMs, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 23:00:00 GMT')
})

Deno.test('Time.alignTime: 4h interval next bucket at 03:00', () => {
  const timestampMs = getTimestampUtc(1, 3, 1)
  const intervalMs = Time.parseTimeframe('4h')
  const bucketStartMs = Time.alignTime(timestampMs, intervalMs, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 03:00:00 GMT')
})

Deno.test('Time.alignTime: 4h interval with anchor 23', () => {
  const timestampMs = getTimestampUtc(1, 2, 59)
  const intervalMs = Time.parseTimeframe('4h')
  const bucketStartMs = Time.alignTime(timestampMs, intervalMs, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Wed, 31 Dec 2025 23:00:00 GMT')
})

Deno.test('Time.alignTime: aligns to hour bucket (anchor 23)', () => {
  const timestampMs = getTimestampUtc(1, 10, 17)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
})

Deno.test('Time.alignTime: anchor with minute 23:30', () => {
  const timestampMs = getTimestampUtc(1, 10, 45)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour, 10, 30)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:30:00 GMT')
})

Deno.test('Time.alignTime: default anchor (23) when omitted', () => {
  const timestampMs = getTimestampUtc(1, 10, 5)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 10:00:00 GMT')
})

Deno.test('Time.alignTime: timestamp on bucket boundary unchanged', () => {
  const exactTimestampMs = getTimestampUtc(1, 10, 0)
  const bucketStartMs = Time.alignTime(exactTimestampMs, Time.msPerHour, 23)
  assertEquals(bucketStartMs, exactTimestampMs)
})

Deno.test('Time.alignTime: year boundary 23:59 with 1h anchor 23', () => {
  const timestampMs = Date.UTC(2025, 11, 31, 23, 59)
  const bucketStartMs = Time.alignTime(timestampMs, Time.msPerHour, 23)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Wed, 31 Dec 2025 23:00:00 GMT')
})

Deno.test('Time.getBucketStart: 1Mc February 2026', () => {
  const timestampMs = Date.UTC(2026, 1, 20, 12, 0)
  const bucketStartMs = Time.getBucketStart(timestampMs, '1Mc')
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Sun, 01 Feb 2026 00:00:00 GMT')
})

Deno.test('Time.getBucketStart: 1Mc returns first of month', () => {
  const timestampMs = getTimestampUtc(20, 14, 30)
  const bucketStartMs = Time.getBucketStart(timestampMs, '1Mc')
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Thu, 01 Jan 2026 00:00:00 GMT')
})

Deno.test('Time.getBucketStart: 1W returns Monday 00:00', () => {
  const timestampMs = getTimestampUtc(15, 12, 0)
  const bucketStartMs = Time.getBucketStart(timestampMs, '1W', 0, 0, 1)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Mon, 12 Jan 2026 00:00:00 GMT')
})

Deno.test('Time.getBucketStart: 1W Sunday start returns same week Sunday', () => {
  const timestampMs = getTimestampUtc(10, 15, 0)
  const bucketStartMs = Time.getBucketStart(timestampMs, '1W', 0, 0, 0)
  assertEquals(new Date(bucketStartMs).toUTCString(), 'Sun, 04 Jan 2026 00:00:00 GMT')
})

Deno.test('Time.parseTimeframe: 1Mc throws', () => {
  assertThrows(() => Time.parseTimeframe('1Mc'), Error, 'getBucketStart')
})

Deno.test('Time.parseTimeframe: 1W throws', () => {
  assertThrows(() => Time.parseTimeframe('1W'), Error, 'getBucketStart')
})

Deno.test('Time.parseTimeframe: invalid empty string throws', () => {
  assertThrows(() => Time.parseTimeframe(''), Error, 'Invalid timeframe format')
})

Deno.test('Time.parseTimeframe: invalid no unit throws', () => {
  assertThrows(() => Time.parseTimeframe('1'), Error, 'Invalid timeframe format')
})

Deno.test('Time.parseTimeframe: invalid only unit throws', () => {
  assertThrows(() => Time.parseTimeframe('m'), Error, 'Invalid timeframe format')
})

Deno.test('Time.parseTimeframe: invalid unit throws', () => {
  assertThrows(() => Time.parseTimeframe('1y'), Error, 'Invalid timeframe format')
})

Deno.test('Time.parseTimeframe: valid day', () => {
  assertEquals(Time.parseTimeframe('1d'), Time.msPerDay)
  assertEquals(Time.parseTimeframe('2d'), 2 * Time.msPerDay)
})

Deno.test('Time.parseTimeframe: valid hour', () => {
  assertEquals(Time.parseTimeframe('1h'), Time.msPerHour)
  assertEquals(Time.parseTimeframe('4h'), 4 * Time.msPerHour)
})

Deno.test('Time.parseTimeframe: valid minute', () => {
  assertEquals(Time.parseTimeframe('1m'), Time.msPerMinute)
  assertEquals(Time.parseTimeframe('15m'), 15 * Time.msPerMinute)
})

Deno.test('Time.parseTimeframe: valid month', () => {
  assertEquals(Time.parseTimeframe('1M'), Time.msPerMonth)
  assertEquals(Time.parseTimeframe('2M'), 2 * Time.msPerMonth)
})

Deno.test('Time.parseTimeframe: 30m and 6h', () => {
  assertEquals(Time.parseTimeframe('30m'), 30 * Time.msPerMinute)
  assertEquals(Time.parseTimeframe('6h'), 6 * Time.msPerHour)
})

Deno.test('Time.parseTimeframe: valid week', () => {
  assertEquals(Time.parseTimeframe('1w'), Time.msPerWeek)
  assertEquals(Time.parseTimeframe('2w'), 2 * Time.msPerWeek)
})
