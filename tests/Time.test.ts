import { assertEquals, assertThrows } from '@std/assert'
import { Time } from '@app/Time.ts'

function getTs(d: number, h: number, m: number): number {
  return Date.UTC(2025, 0, d, h, m)
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
  const ts = getTs(1, 10, 22)
  const intervalMs = Time.parseTimeframe('15m')
  const bucket = Time.alignTime(ts, intervalMs, 0)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:15:00 GMT')
})

Deno.test('Time.alignTime: 1d interval anchor 00:00', () => {
  const ts = getTs(1, 14, 30)
  const intervalMs = Time.parseTimeframe('1d')
  const bucket = Time.alignTime(ts, intervalMs, 0)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 00:00:00 GMT')
})

Deno.test('Time.alignTime: 4h interval next bucket at 03:00', () => {
  const ts = getTs(1, 3, 1)
  const intervalMs = Time.parseTimeframe('4h')
  const bucket = Time.alignTime(ts, intervalMs, 23)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 03:00:00 GMT')
})

Deno.test('Time.alignTime: 4h interval with anchor 23', () => {
  const ts = getTs(1, 2, 59)
  const intervalMs = Time.parseTimeframe('4h')
  const bucket = Time.alignTime(ts, intervalMs, 23)
  assertEquals(new Date(bucket).toUTCString(), 'Tue, 31 Dec 2024 23:00:00 GMT')
})

Deno.test('Time.alignTime: aligns to hour bucket (anchor 23)', () => {
  const ts = getTs(1, 10, 17)
  const bucket = Time.alignTime(ts, Time.msPerHour, 23)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
})

Deno.test('Time.alignTime: anchor with minute 23:30', () => {
  const ts = getTs(1, 10, 45)
  const bucket = Time.alignTime(ts, Time.msPerHour, 10, 30)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:30:00 GMT')
})

Deno.test('Time.alignTime: default anchor (23) when omitted', () => {
  const ts = getTs(1, 10, 5)
  const bucket = Time.alignTime(ts, Time.msPerHour)
  assertEquals(new Date(bucket).toUTCString(), 'Wed, 01 Jan 2025 10:00:00 GMT')
})

Deno.test('Time.alignTime: timestamp on bucket boundary unchanged', () => {
  const exact = getTs(1, 10, 0)
  const bucket = Time.alignTime(exact, Time.msPerHour, 23)
  assertEquals(bucket, exact)
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

Deno.test('Time.parseTimeframe: valid week', () => {
  assertEquals(Time.parseTimeframe('1w'), Time.msPerWeek)
  assertEquals(Time.parseTimeframe('2w'), 2 * Time.msPerWeek)
})
