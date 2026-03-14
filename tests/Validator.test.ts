import { assertEquals } from '@std/assert'
import type * as Types from '@app/Types.ts'
import { Validator } from '@app/Validator.ts'

Deno.test('validateCandles: allowDuplicates permits duplicates', () => {
  const candles: Types.CandleData[] = [
    { time: 1000, open: 1, high: 1, low: 1, close: 1 },
    { time: 1000, open: 2, high: 2, low: 2, close: 2 }
  ]
  const validationResult = Validator.validateCandles(candles, { allowDuplicates: true })
  assertEquals(validationResult.valid, true)
})

Deno.test('validateCandles: allowUnordered permits unordered', () => {
  const candles: Types.CandleData[] = [
    { time: 2000, open: 1, high: 1, low: 1, close: 1 },
    { time: 1000, open: 2, high: 2, low: 2, close: 2 }
  ]
  const validationResult = Validator.validateCandles(candles, { allowUnordered: true })
  assertEquals(validationResult.valid, true)
})

Deno.test('validateCandles: duplicate time invalid by default', () => {
  const candles: Types.CandleData[] = [
    { time: 1000, open: 1, high: 1, low: 1, close: 1 },
    { time: 1000, open: 2, high: 2, low: 2, close: 2 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('Duplicate')),
    true
  )
})

Deno.test('validateCandles: empty array valid', () => {
  const validationResult = Validator.validateCandles([])
  assertEquals(validationResult.valid, true)
})

Deno.test('validateCandles: negative time invalid', () => {
  const candles: Types.CandleData[] = [{ time: -1, open: 1, high: 1, low: 1, close: 1 }]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('non-negative')),
    true
  )
})

Deno.test('validateCandles: negative volume invalid', () => {
  const candles: Types.CandleData[] = [
    { time: Date.UTC(2026, 0, 1), open: 1, high: 1, low: 1, close: 1, volume: -1 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('volume')),
    true
  )
})

Deno.test('validateCandles: NaN time invalid', () => {
  const candles: Types.CandleData[] = [{ time: NaN, open: 1, high: 1, low: 1, close: 1 }]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
})

Deno.test('validateCandles: non-finite open invalid', () => {
  const candles: Types.CandleData[] = [
    { time: Date.UTC(2026, 0, 1), open: NaN, high: 1, low: 1, close: 1 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('open')),
    true
  )
})

Deno.test('validateCandles: non-finite high invalid', () => {
  const candles: Types.CandleData[] = [
    { time: Date.UTC(2026, 0, 1), open: 1, high: Infinity, low: 1, close: 1 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('high')),
    true
  )
})

Deno.test('validateCandles: result contains errors array when invalid', () => {
  const candles: Types.CandleData[] = [{ time: -1, open: NaN, high: 1, low: 1, close: 1 }]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(Array.isArray(validationResult.errors), true)
  assertEquals(validationResult.errors.length >= 1, true)
})

Deno.test('validateCandles: strictOHLC accepts high >= low', () => {
  const candles: Types.CandleData[] = [
    { time: Date.UTC(2026, 0, 1), open: 1, high: 2, low: 1, close: 1.5 }
  ]
  const validationResult = Validator.validateCandles(candles, { strictOHLC: true })
  assertEquals(validationResult.valid, true)
})

Deno.test('validateCandles: strictOHLC rejects high < low', () => {
  const candles: Types.CandleData[] = [{ time: 1000, open: 1, high: 1, low: 2, close: 1.5 }]
  const validationResult = Validator.validateCandles(candles, { strictOHLC: true })
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('high')),
    true
  )
})

Deno.test('validateCandles: unordered invalid by default', () => {
  const candles: Types.CandleData[] = [
    { time: 2000, open: 1, high: 1, low: 1, close: 1 },
    { time: 1000, open: 2, high: 2, low: 2, close: 2 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, false)
  assertEquals(
    validationResult.errors.some((errorMessage) => errorMessage.includes('Unordered')),
    true
  )
})

Deno.test('validateCandles: valid data returns valid', () => {
  const candles: Types.CandleData[] = [
    { time: 1000, open: 1, high: 2, low: 1, close: 1.5 },
    { time: 2000, open: 1.5, high: 2.5, low: 1.2, close: 2 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, true)
  assertEquals(validationResult.errors.length, 0)
})

Deno.test('validateCandles: valid with volume', () => {
  const timestampMs = Date.UTC(2026, 0, 15, 10, 0)
  const candles: Types.CandleData[] = [
    { time: timestampMs, open: 1, high: 2, low: 1, close: 1.5, volume: 100 }
  ]
  const validationResult = Validator.validateCandles(candles)
  assertEquals(validationResult.valid, true)
  assertEquals(validationResult.errors.length, 0)
})
