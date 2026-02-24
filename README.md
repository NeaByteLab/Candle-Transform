# Candle Transform [![Module type: Deno/ESM](https://img.shields.io/badge/module%20type-deno%2Fesm-brightgreen)](https://github.com/NeaByteLab/Candle-Transform) [![npm version](https://img.shields.io/npm/v/@neabyte/candle-transform.svg)](https://www.npmjs.org/package/@neabyte/candle-transform) [![JSR](https://jsr.io/badges/@neabyte/candle-transform)](https://jsr.io/@neabyte/candle-transform) [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

High-precision OHLC transformation with strict anchor time alignment.

## Features

- **Strict Anchor Alignment**: Ensures candles align with specific sessions (e.g., 4h candle starting at 23:00).
- **High Performance**: Batch processing optimized for thousands of candles.
- **Flexible Timeframes**: Supports `m`, `h`, `d` inputs.

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
console.log(daily) // Output: [ { time: 1704063600000, open: 1, high: 2, low: 0.5, close: 1.5, ... }, ... ]
```

## API Reference

### `Transform.from(data)`

Creates a transformation instance from source data.

**Parameters:**

- `data: CandleData[]` - Array of source candles

### `.anchor(hour)`

Sets the anchor hour in UTC for time alignment.

**Parameters:**

- `hour: number` - Hour (0-23). Default is `23` (23:00 UTC Market Open)

### `.to(timeframe)`

Executes the transformation.

**Parameters:**

- `timeframe: TimeframeStr` - Target timeframe (e.g., `'15m'`, `'4h'`, `'1d'`)

**Returns:** `CandleData[]` - Transformed candles

## Limitations

Currently supports timeframes up to `1d` (Daily). Weekly (`1w`) and Monthly (`1M`) are not yet supported.

## License

This project is licensed under the MIT license. See the [LICENSE](LICENSE) file for more info.
