import { assertEquals } from '@std/assert'
import { type CandleData, Transform } from '@app/index.ts'

function getTs(d: number, h: number, m: number): number {
  return Date.UTC(2025, 0, d, h, m)
}

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
