# lib-dcim

A browser-native image transformation library that compiles declarative pipelines into dependency-free JavaScript, then runs them in a Web Worker via the Canvas API.

```bash
npm i lib-dcim
```

## How it works

You describe a pipeline using a fluent builder (`dcim()`), call `.compile()` to get a self-contained JS module, then hand that module to `createWorker()` which spins up a Worker to process images off the main thread.

## Quick Start

```ts
import {dcim, createWorker} from "lib-dcim"

const code = dcim().resize(1280, null, {fit: "cover"}).webp(85).compile()

const processor = createWorker(code)

const blob = await processor.run(imageFile)
processor.dispose()
```

## API

### `dcim()`

Returns an empty `DCIM` pipeline builder. All methods return a new `DCIM` instance — the builder is immutable.

### `DCIM`

#### `.resize(width, height, options?)`

Add a resize operation. At least one dimension must be non-null.

| Option   | Type                             | Default   | Description                                      |
| -------- | -------------------------------- | --------- | ------------------------------------------------ |
| `fit`    | `"cover" \| "contain" \| "fill"` | `"cover"` | How to fit the image                             |
| `aspect` | `number`                         | —         | Aspect ratio used to infer the missing dimension |

#### `.png()`

Convert to PNG (lossless).

#### `.jpeg(quality?)`

Convert to JPEG. `quality` is 0–100, default `100`.

#### `.webp(quality?)`

Convert to WebP. `quality` is 0–100, default `100`.

#### `.avif(quality?)`

Convert to AVIF. `quality` is 0–100, default `100`.

#### `.compile()`

Compile the pipeline into a self-contained JavaScript module string. The module exports:

- `transform(image)` — applies pixel operations, returns a canvas
- `encode(image)` — applies operations and returns a `Blob`

### `createWorker(code)`

Create a reusable `WorkerProcessor` from compiled pipeline code. The Worker is created once and reused across calls.

```ts
const processor = createWorker(code)
const blob = await processor.run(file) // ImageBitmapSource
processor.dispose() // release Worker and Blob URL
```

### `WorkerProcessor`

| Method       | Description                                  |
| ------------ | -------------------------------------------- |
| `run(image)` | Process an image and resolve to a `Blob`     |
| `dispose()`  | Terminate the Worker and revoke the Blob URL |

`ImageInput` accepts anything that `createImageBitmap` accepts: `Blob`, `File`, `ImageData`, `HTMLImageElement`, etc.

### `compile(operations)`

Lower-level export. Compile an `Operation[]` directly to JavaScript source.

## Types

```ts
interface ResizeOperation {
    type: "ResizeOperation"
    width: number | null
    height: number | null
    fit: "cover" | "contain" | "fill"
    aspect?: number
}

interface ConvertOperation {
    type: "ConvertOperation"
    format: "png" | "jpeg" | "webp" | "avif"
    quality: number
}

type Operation = ResizeOperation | ConvertOperation
type ImageInput = ImageBitmapSource
```

## Development

```bash
bun install
bun test
bun run build
```
