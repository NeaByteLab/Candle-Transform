<div align="center">

# Candle Transform

High-precision OHLC transformation with strict anchor time alignment.

[![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Candle-Transform) [![npm version](https://img.shields.io/npm/v/@neabyte/candle-transform.svg)](https://www.npmjs.org/package/@neabyte/candle-transform) [![JSR](https://jsr.io/badges/@neabyte/candle-transform)](https://jsr.io/@neabyte/candle-transform) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

</div>

## Features

- **Strict Anchor Alignment**: Ensures candles align with specific sessions (e.g., 4h at 23:00 or 23:30 UTC).
- **High Performance**: Batch processing optimized for thousands of candles at once.
- **Flexible Timeframes**: Supports `m`, `h`, `d`, `w`, `M` (e.g. `15m`, `4h`, `1d`, `1w`, `1M`).

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
const h4 = Transform.from(data).to('4h')
console.log(h4) // Output: [ { time: 1704063600000, open: 1, high: 2, low: 0.5, close: 1.5, ... }, ... ]

// Convert to 1-day chart with custom anchor (e.g., 00:00 UTC)
const daily = Transform.from(data).anchor(0).to('1d')

// Anchor with hour and minute (e.g., 23:30 UTC)
const session = Transform.from(data).anchor(23, 30).to('4h')
```

## API Reference

### Transform.from

```typescript
Transform.from(data)
```

- `data` `<CandleData[]>`: Array of source OHLC candles
- Returns: `Transform`
- Description: Creates a transformation instance for fluent chaining.

### Transform.prototype.anchor

```typescript
transform.anchor(hour, minute)
```

- `hour` `<number>`: Anchor hour in UTC (0–23). Defaults to `23`.
- `minute` `<number>`: (Optional) Anchor minute (0–59). Defaults to `0`.
- Returns: `this`
- Description: Sets the anchor time for bucket alignment (e.g. 23:30 UTC).

### Transform.prototype.to

```typescript
transform.to(timeframe)
```

- `timeframe` `<string>`: Target timeframe (e.g. `'15m'`, `'4h'`, `'1d'`, `'1w'`, `'1M'`).
- Returns: `CandleData[]`
- Description: Runs the transformation and returns aggregated candles.

### Transform.execute

```typescript
Transform.execute(candles, timeframe, anchorHour, anchorMinute)
```

- `candles` `<CandleData[]>`: Source candle array
- `timeframe` `<string>`: Target timeframe (e.g. `'4h'`, `'1d'`)
- `anchorHour` `<number>`: (Optional) Anchor hour (0–23). Defaults to `23`.
- `anchorMinute` `<number>`: (Optional) Anchor minute (0–59). Defaults to `0`.
- Returns: `CandleData[]`
- Description: Runs batch transformation without a fluent instance.

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

### Time.parseTimeframe

```typescript
Time.parseTimeframe(tf)
```

- `tf` `<string>`: Timeframe string (e.g. `'15m'`, `'4h'`, `'1d'`, `'1w'`, `'1M'`)
- Returns: `number`
- Description: Parses timeframe string to duration in milliseconds.

## Note

- `1w` = 7 days; `1M` = 30-day period (fixed length, not calendar month).

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
