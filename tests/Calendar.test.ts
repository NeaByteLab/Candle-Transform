import { assertEquals } from '@std/assert'
import { Calendar } from '@app/Calendar.ts'

Deno.test('getMonthStart: Dec 31 returns Dec 1', () => {
  const timestampMs = Date.UTC(2025, 11, 31, 23, 59)
  const periodStartMs = Calendar.getMonthStart(timestampMs)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Mon, 01 Dec 2025 00:00:00 GMT')
})

Deno.test('getMonthStart: February 2026', () => {
  const timestampMs = Date.UTC(2026, 1, 20, 12, 0)
  const periodStartMs = Calendar.getMonthStart(timestampMs)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Sun, 01 Feb 2026 00:00:00 GMT')
})

Deno.test('getMonthStart: Jan 1 00:00 returns self', () => {
  const timestampMs = Date.UTC(2026, 0, 1, 0, 0, 0)
  const periodStartMs = Calendar.getMonthStart(timestampMs)
  assertEquals(periodStartMs, timestampMs)
})

Deno.test('getMonthStart: returns first day of month UTC', () => {
  const timestampMs = Date.UTC(2026, 0, 15, 14, 30)
  const periodStartMs = Calendar.getMonthStart(timestampMs)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Thu, 01 Jan 2026 00:00:00 GMT')
})

Deno.test('getWeekStart: Jan 1 2026 Thursday with Monday start returns prior Monday', () => {
  const timestampMs = Date.UTC(2026, 0, 1, 12, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 1)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Mon, 29 Dec 2025 00:00:00 GMT')
})

Deno.test('getWeekStart: Jan 4 2026 Sunday with Sunday start returns self', () => {
  const timestampMs = Date.UTC(2026, 0, 4, 0, 0, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 0)
  assertEquals(periodStartMs, timestampMs)
})

Deno.test('getWeekStart: Monday 00:00 returns self', () => {
  const timestampMs = Date.UTC(2026, 0, 5, 0, 0, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 1)
  assertEquals(periodStartMs, timestampMs)
})

Deno.test('getWeekStart: Monday start returns same week Monday', () => {
  const timestampMs = Date.UTC(2026, 0, 15, 12, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 1)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Mon, 12 Jan 2026 00:00:00 GMT')
})

Deno.test('getWeekStart: Saturday start (6)', () => {
  const timestampMs = Date.UTC(2026, 0, 8, 10, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 6)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Sat, 03 Jan 2026 00:00:00 GMT')
})

Deno.test('getWeekStart: Sunday start returns same week Sunday', () => {
  const timestampMs = Date.UTC(2026, 0, 15, 12, 0)
  const periodStartMs = Calendar.getWeekStart(timestampMs, 0)
  assertEquals(new Date(periodStartMs).toUTCString(), 'Sun, 11 Jan 2026 00:00:00 GMT')
})
