import {_workerSource} from "#src/_worker-source"
import {createWorker, dcim} from "#src/index"

describe("workers", () => {
    it("wraps compiled modules for worker execution", () => {
        const source = _workerSource(dcim().resize(2, 2).png().compile())

        expect(source).toContain("self.onmessage = async (event) =>")
        expect(source).toContain("const id = event.data.id")
        expect(source).toContain("const image = await _workerImage(event.data.image)")
        expect(source).toContain("const value = await encode(image)")
        expect(source).toContain('self.postMessage({id, type: "success", value})')
    })

    it("creates reusable worker processors", async () => {
        const previousWorker = globalThis.Worker
        const previousCreateObjectURL = URL.createObjectURL
        const previousRevokeObjectURL = URL.revokeObjectURL
        const messages: unknown[] = []
        const objectURLs: string[] = []
        let terminated = false

        class _FakeWorker {
            onerror: ((event: ErrorEvent) => undefined) | null = null
            onmessage: ((event: MessageEvent) => undefined) | null = null

            constructor(
                readonly url: string,
                readonly options: WorkerOptions,
            ) {}

            postMessage(value: unknown): undefined {
                messages.push(value)
                this.onmessage?.(
                    new MessageEvent("message", {
                        data: {id: 0, type: "success", value: new Blob()},
                    }),
                )

                return undefined
            }

            terminate(): undefined {
                terminated = true

                return undefined
            }
        }

        globalThis.Worker = _FakeWorker as unknown as typeof Worker
        URL.createObjectURL = () => {
            objectURLs.push("blob:dcim")

            return "blob:dcim"
        }
        URL.revokeObjectURL = (url: string) => {
            objectURLs.push(`revoked:${url}`)
        }

        try {
            const processor = createWorker(dcim().png().compile())
            const blob = await processor.run(new Blob())
            processor.dispose()

            expect(blob).toBeInstanceOf(Blob)
            expect(messages).toEqual([{id: 0, image: expect.any(Blob)}])
            expect(objectURLs).toEqual(["blob:dcim", "revoked:blob:dcim"])
            expect(terminated).toBe(true)
        } finally {
            globalThis.Worker = previousWorker
            URL.createObjectURL = previousCreateObjectURL
            URL.revokeObjectURL = previousRevokeObjectURL
        }
    })
})
