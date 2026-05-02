export interface _WorkerErrorData {
    message: string
    stack?: string
}

/** Build the JavaScript source used by the module Worker wrapper. */
export function _workerSource(code: string): string {
    return `${code}
async function _workerImage(image) {
    if (typeof createImageBitmap === "function" && image && image.type) {
        return await createImageBitmap(image)
    }

    return image
}
self.onmessage = async (event) => {
    const id = event.data.id

    try {
        const image = await _workerImage(event.data.image)
        const value = await encode(image)
        self.postMessage({id, type: "success", value})
    } catch (error) {
        self.postMessage({
            id,
            type: "error",
            value: error instanceof Error
                ? {message: error.message, stack: error.stack}
                : {message: String(error)}
        })
    }
}
`
}
