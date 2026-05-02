import type {ResizeOperation} from "#src/_dcim"
import {_assertPositiveInteger, _assertPositiveNumber} from "#src/_validation"

const _fits = new Set<ResizeOperation["fit"]>(["contain", "cover", "fill"])

export function _compileResizeOperation(operation: ResizeOperation): string {
    const size = _resizeSize(operation)

    if (size.width === null && size.height === null) {
        throw new Error("ResizeOperation requires at least one dimension")
    }

    if (!_fits.has(operation.fit)) {
        throw new Error(`Unsupported resize fit: ${operation.fit}`)
    }

    if (size.width !== null) {
        _assertPositiveInteger("width", size.width)
    }

    if (size.height !== null) {
        _assertPositiveInteger("height", size.height)
    }

    return `    output = ${_resizeFunction(operation.fit)}(output, ${size.width ?? "null"}, ${size.height ?? "null"})`
}

function _resizeFunction(fit: ResizeOperation["fit"]): string {
    switch (fit) {
        case "contain":
            return "_resizeContain"
        case "cover":
            return "_resizeCover"
        case "fill":
            return "_resizeFill"
    }
}

function _resizeSize(operation: ResizeOperation): {
    height: number | null
    width: number | null
} {
    if (operation.aspect === undefined) {
        return {height: operation.height, width: operation.width}
    }

    _assertPositiveNumber("aspect", operation.aspect)

    if (operation.width === null && operation.height !== null) {
        return {
            height: operation.height,
            width: Math.max(1, Math.round(operation.height * operation.aspect)),
        }
    }

    if (operation.height === null && operation.width !== null) {
        return {
            height: Math.max(1, Math.round(operation.width / operation.aspect)),
            width: operation.width,
        }
    }

    return {height: operation.height, width: operation.width}
}
