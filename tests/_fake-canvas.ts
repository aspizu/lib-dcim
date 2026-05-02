interface _DocumentLike {
    createElement(tag: string): _FakeCanvas
}

export class _FakeCanvas {
    readonly calls: unknown[][] = []
    height = 0
    width = 0

    getContext(name: string): _FakeContext | null {
        if (name !== "2d") {
            return null
        }

        return new _FakeContext(this)
    }

    toBlob(
        callback: (blob: Blob | null) => undefined,
        type: string,
        quality: number,
    ): undefined {
        callback(new Blob([], {type}))
        this.calls.push(["toBlob", type, quality])

        return undefined
    }
}

class _FakeContext {
    constructor(private readonly _canvas: _FakeCanvas) {}

    drawImage(...args: unknown[]): undefined {
        this._canvas.calls.push(["drawImage", ...args])

        return undefined
    }

    putImageData(...args: unknown[]): undefined {
        this._canvas.calls.push(["putImageData", ...args])

        return undefined
    }
}

export async function _loadTransform(
    code: string,
): Promise<(image: {height: number; width: number}) => _FakeCanvas> {
    const module = await _loadModule(code)

    return module.default
}

export async function _loadEncode(
    code: string,
): Promise<(image: {height: number; width: number}) => Promise<Blob>> {
    const module = await _loadModule(code)

    return module.encode
}

async function _loadModule(code: string): Promise<{
    default: (image: {height: number; width: number}) => _FakeCanvas
    encode: (image: {height: number; width: number}) => Promise<Blob>
}> {
    const global = globalThis as {document: _DocumentLike}
    global.document = {createElement: () => new _FakeCanvas()}

    return await import(`data:text/javascript;base64,${btoa(code)}`)
}
