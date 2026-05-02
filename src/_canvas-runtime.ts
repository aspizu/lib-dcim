export const _runtime = String.raw`
function _canvas(width, height) {
    if (typeof OffscreenCanvas === "function") return new OffscreenCanvas(width, height)
    const canvas = document.createElement("canvas")
    canvas.width = width
    canvas.height = height
    return canvas
}
function _context(canvas) {
    const context = canvas.getContext("2d")
    if (!context) throw new Error("2D canvas context is unavailable")
    return context
}
function _size(image) {
    return {
        width: image.width ?? image.videoWidth ?? image.naturalWidth,
        height: image.height ?? image.videoHeight ?? image.naturalHeight,
    }
}
function _source(image) {
    if (typeof image.getContext === "function") return image
    const size = _size(image)
    if (!size.width || !size.height) throw new Error("Image width and height are required")
    const canvas = _canvas(size.width, size.height)
    const context = _context(canvas)
    if (image.data && typeof ImageData === "function" && image instanceof ImageData) {
        context.putImageData(image, 0, 0)
    } else {
        context.drawImage(image, 0, 0)
    }
    return canvas
}
function _resizeSize(source, width, height) {
    const sourceWidth = source.width
    const sourceHeight = source.height
    return [
        width ?? Math.max(1, Math.round((sourceWidth * height) / sourceHeight)),
        height ?? Math.max(1, Math.round((sourceHeight * width) / sourceWidth)),
    ]
}
function _resizeFill(image, requestedWidth, requestedHeight) {
    const source = _source(image)
    const [width, height] = _resizeSize(source, requestedWidth, requestedHeight)
    const canvas = _canvas(width, height)
    _context(canvas).drawImage(source, 0, 0, source.width, source.height, 0, 0, width, height)
    return canvas
}
function _resizeCover(image, requestedWidth, requestedHeight) {
    const source = _source(image)
    const [width, height] = _resizeSize(source, requestedWidth, requestedHeight)
    const sourceWidth = source.width
    const sourceHeight = source.height
    const canvas = _canvas(width, height)
    const context = _context(canvas)
    const scale = Math.max(width / sourceWidth, height / sourceHeight)
    const sw = width / scale
    const sh = height / scale
    context.drawImage(source, (sourceWidth - sw) / 2, (sourceHeight - sh) / 2, sw, sh, 0, 0, width, height)
    return canvas
}
function _resizeContain(image, requestedWidth, requestedHeight) {
    const source = _source(image)
    const [width, height] = _resizeSize(source, requestedWidth, requestedHeight)
    const sourceWidth = source.width
    const sourceHeight = source.height
    const canvas = _canvas(width, height)
    const context = _context(canvas)
    const scale = Math.min(width / sourceWidth, height / sourceHeight)
    const dw = sourceWidth * scale
    const dh = sourceHeight * scale
    context.drawImage(source, 0, 0, sourceWidth, sourceHeight, (width - dw) / 2, (height - dh) / 2, dw, dh)
    return canvas
}
async function _encode(canvas, type, quality) {
    if (typeof canvas.convertToBlob === "function") {
        return await canvas.convertToBlob({type, quality})
    }
    return await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Canvas encoding failed"))), type, quality)
    })
}
`
