<div align="center">

# Candle Transform

High-precision OHLC transformation with strict anchor time alignment.

[![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Candle-Transform) [![npm version](https://img.shields.io/npm/v/@neabyte/candle-transform.svg)](https://www.npmjs.org/package/@neabyte/candle-transform) [![JSR](https://jsr.io/badges/@neabyte/candle-transform)](https://jsr.io/@neabyte/candle-transform) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## Features

- **High Performance**: Batch processing optimized for thousands of candles at once.
- **Strict Anchor Alignment**: Ensures candles align with specific sessions (e.g., 4h at 23:00 or 23:30 UTC).
- **Flexible Timeframes**: Supports `m`, `h`, `d`, `w`, `M` (fixed) and `1W` (calendar week), `1Mc` (calendar month).
- **Input validation**: Optional `validate: true` to check time, OHLC, duplicates, and order before transform.

## Installation

**Deno (JSR):**

```bash
deno add jsr:@neabyte/candle-transform
```

**npm:**

```bash
npm install @neabyte/candle-transform
```

## Usage

```typescript
import { Transform } from '@neabyte/candle-transform'

// 1m data input
const data = [
  { time: 1704067200000, open: 1.0, high: 2.0, low: 0.9, close: 1.5 },
  { time: 1704067260000, open: 1.5, high: 2.5, low: 1.4, close: 2.0 },
  { time: 1704067320000, open: 2.0, high: 3.0, low: 1.8, close: 2.5 }
  // ... more candles
]

// Convert to 4-hour chart (Default Anchor 23:00 UTC)
const h4 = Transform.fromCandles(data).toTimeframe('4h')
console.log(h4) // Output: [ { time: 1704063600000, open: 1, high: 2, low: 0.5, close: 1.5, ... }, ... ]

// Convert to 1-day chart with custom anchor (e.g., 00:00 UTC)
const daily = Transform.fromCandles(data).setAnchorTime(0).toTimeframe('1d')

// Anchor with hour and minute (e.g., 23:30 UTC)
const session = Transform.fromCandles(data).setAnchorTime(23, 30).toTimeframe('4h')

// Calendar week (Monday start) and calendar month
const weekly = Transform.fromCandles(data).toTimeframe('1W')
const monthly = Transform.fromCandles(data).toTimeframe('1Mc')

// Optional validation before transform
const safe = Transform.fromCandles(data).toTimeframe('4h', { validate: true })
```

## API Reference

### Transform.fromCandles

```typescript
Transform.fromCandles(data)
```

- `data` `<CandleData[]>`: Array of source OHLC candles
- Returns: `Transform`
- Description: Creates a transformation instance for fluent chaining.

### Transform.prototype.setAnchorTime

```typescript
transform.setAnchorTime(hour, minute)
```

- `hour` `<number>`: Anchor hour in UTC (0–23). Defaults to `23`.
- `minute` `<number>`: (Optional) Anchor minute (0–59). Defaults to `0`.
- Returns: `this`
- Description: Sets the anchor time for bucket alignment (e.g. 23:30 UTC).

### Transform.prototype.toTimeframe

```typescript
transform.toTimeframe(timeframe, options)
```

- `timeframe` `<string>`: Target (e.g. `'4h'`, `'1d'`, `'1W'`, `'1Mc'`).
- `options` `<object>`: (Optional) `{ validate?: boolean }` — run input validation before transform.
- Returns: `CandleData[]`
- Description: Runs the transformation and returns aggregated candles.

### Transform.prototype.setWeekStartDay

```typescript
transform.setWeekStartDay(weekStartDay)
```

- `weekStartDay` `<number>`: Week start (0=Sun, 1=Mon, …, 6=Sat). Default `1` (Monday). Used for `'1W'`.
- Returns: `this`
- Description: Sets week start day for calendar week timeframe.

### Transform.execute

```typescript
Transform.execute(candles, timeframe, anchorHour, anchorMinute, options)
```

- `candles` `<CandleData[]>`: Source candle array
- `timeframe` `<string>`: Target (e.g. `'4h'`, `'1d'`, `'1W'`, `'1Mc'`)
- `anchorHour` `<number>`: (Optional) Anchor hour (0–23). Defaults to `23`.
- `anchorMinute` `<number>`: (Optional) Anchor minute (0–59). Defaults to `0`.
- `options` `<object>`: (Optional) `{ weekStartDay?: 0|1|…|6, validate?: boolean }`
- Returns: `CandleData[]`
- Description: Runs batch transformation without a fluent instance.

### Time (constants)

Static readonly: `msPerMinute`, `msPerHour`, `msPerDay`, `msPerWeek`, `msPerMonth` (milliseconds per unit), `defaultAnchorOffset` (23h in ms).

### Time.alignTime

```typescript
Time.alignTime(timestamp, intervalMs, anchorHour, anchorMinute)
```

- `timestamp` `<number>`: Input time in milliseconds
- `intervalMs` `<number>`: Bucket interval in milliseconds
- `anchorHour` `<number>`: (Optional) Anchor hour (0–23). Defaults to `23`.
- `anchorMinute` `<number>`: (Optional) Anchor minute (0–59). Defaults to `0`.
- Returns: `number`
- Description: Aligns timestamp to the bucket open time on the anchor grid.

### Time.getBucketStart

```typescript
Time.getBucketStart(timestamp, timeframe, anchorHour, anchorMinute, weekStartDay)
```

- `timestamp` `<number>`: Input time in ms
- `timeframe` `<string>`: e.g. `'4h'`, `'1d'`, `'1W'`, `'1Mc'`
- `anchorHour` / `anchorMinute`: Used for fixed intervals only
- `weekStartDay` `<number>`: (Optional) 0–6 for `'1W'`. Default `1` (Monday)
- Returns: `number`
- Description: Bucket start for any timeframe (fixed or calendar).

### Time.parseTimeframe

```typescript
Time.parseTimeframe(timeframeStr)
```

- `timeframeStr` `<string>`: Fixed timeframe only (e.g. `'15m'`, `'4h'`, `'1d'`, `'1w'`, `'1M'`). Use `Time.getBucketStart` for `'1W'` / `'1Mc'`.
- Returns: `number`
- Description: Parses timeframe string to duration in milliseconds.

### Validator.validateCandles

```typescript
Validator.validateCandles(candles, options)
```

- `candles` `<CandleData[]>`: Array to validate
- `options` `<object>`: (Optional) `{ allowDuplicates?, allowUnordered?, strictOHLC? }`
- Returns: `{ valid: boolean, errors: string[] }`
- Description: Validates time (finite, non-negative), OHLC, duplicates, and order.

## Note

- `1w` = 7 days (fixed); `1M` = 30-day period (fixed). `1W` = calendar week (default Monday); `1Mc` = calendar month (first of month UTC). Validation is opt-in via `toTimeframe(..., { validate: true })` or `Transform.execute(..., { validate: true })`.

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
