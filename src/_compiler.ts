import {_runtime} from "./_canvas-runtime"
import type {ConvertOperation, Operation} from "./_dcim"
import {_compileResizeOperation} from "./_resize-compiler"
import {_assertIntegerInRange} from "./_validation"

const _formats = new Set<ConvertOperation["format"]>(["avif", "jpeg", "png", "webp"])

/**
 * Compile image operations into dependency-free JavaScript that uses Canvas.
 *
 * The generated module exports `transform(image)`, which returns a canvas with
 * the pixel transformations applied, and `encode(image)`, which returns a Blob
 * using the requested conversion format.
 */
export function compile(operations: readonly Operation[]): string {
    const statements = operations.flatMap(_compileOperation)
    const convert = _lastConvertOperation(operations)

    return [
        _runtime.trim(),
        "",
        "export default function transform(image) {",
        "    let output = image",
        ...statements,
        "    return _source(output)",
        "}",
        "",
        _compileEncodeFunction(convert),
        "",
    ].join("\n")
}

function _compileOperation(operation: Operation): string[] {
    switch (operation.type) {
        case "ConvertOperation":
            _validateConvertOperation(operation)
            return []
        case "ResizeOperation":
            return [_compileResizeOperation(operation)]
    }
}

function _compileEncodeFunction(operation: ConvertOperation | null): string {
    const type = operation === null ? "image/png" : `image/${operation.format}`
    const quality = operation === null ? 1 : operation.quality / 100

    return [
        "export async function encode(image) {",
        "    const canvas = transform(image)",
        `    return await _encode(canvas, ${JSON.stringify(type)}, ${quality})`,
        "}",
    ].join("\n")
}

function _lastConvertOperation(
    operations: readonly Operation[],
): ConvertOperation | null {
    for (let index = operations.length - 1; index >= 0; index -= 1) {
        const operation = operations[index]

        if (operation?.type === "ConvertOperation") {
            _validateConvertOperation(operation)
            return operation
        }
    }

    return null
}

function _validateConvertOperation(operation: ConvertOperation): undefined {
    if (!_formats.has(operation.format)) {
        throw new Error(`Unsupported image format: ${operation.format}`)
    }

    _assertIntegerInRange("quality", operation.quality, 1, 100)

    return undefined
}
