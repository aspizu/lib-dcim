import {createWorker, dcim} from "../src/index"

const code = dcim().resize(480, 360, {fit: "cover"}).webp(82).compile()
const processor = createWorker(code)
const fileInput = _element<HTMLInputElement>("#file")
const preview = _element<HTMLImageElement>("#preview")
const run = _element<HTMLButtonElement>("#run")
const status = _element<HTMLElement>("#status")
const output = _element<HTMLElement>("#code")
let previewUrl: string | null = null

output.textContent = code

fileInput.addEventListener("change", () => {
    const file = fileInput.files?.[0]

    _clearPreview()
    status.textContent = file ? `Selected: ${file.name}` : "Choose an image."
})

run.addEventListener("click", () => {
    void _run()
})

async function _run(): Promise<undefined> {
    const file = fileInput.files?.[0]

    if (file === undefined) {
        status.textContent = "Choose an image first."
        return undefined
    }

    status.textContent = "Running..."

    try {
        const blob = await processor.run(file)
        _clearPreview()
        previewUrl = URL.createObjectURL(blob)
        preview.src = previewUrl
        status.textContent = `Done: ${blob.type}, ${blob.size} bytes`
    } catch (error) {
        status.textContent = error instanceof Error ? error.message : String(error)
    }

    return undefined
}

function _clearPreview(): undefined {
    if (previewUrl !== null) {
        URL.revokeObjectURL(previewUrl)
        previewUrl = null
    }

    preview.removeAttribute("src")

    return undefined
}

function _element<T>(selector: string): T {
    const root = globalThis as typeof globalThis & {
        document: {querySelector: (selector: string) => unknown}
    }
    const element = root.document.querySelector(selector)

    if (element === null) {
        throw new Error(`Missing element: ${selector}`)
    }

    return element as T
}
