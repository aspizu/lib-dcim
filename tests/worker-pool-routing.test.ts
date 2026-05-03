import {createWorkerPool, dcim} from "../src/index"

describe("worker pool routing", () => {
    it("respects jobsPerWorker and waterfall limits when routing", async () => {
        const previousWorker = globalThis.Worker
        const previousCreateObjectURL = URL.createObjectURL
        const previousRevokeObjectURL = URL.revokeObjectURL
        const workerMessages: unknown[][] = []
        const resolvers: Array<() => undefined> = []

        class _FakeWorker {
            onerror: ((event: ErrorEvent) => undefined) | null = null
            onmessage: ((event: MessageEvent) => undefined) | null = null
            private readonly _idx: number

            constructor(
                readonly url: string,
                readonly options: WorkerOptions,
            ) {
                this._idx = workerMessages.length
                workerMessages.push([])
            }

            postMessage(value: unknown): undefined {
                workerMessages[this._idx]!.push(value)
                const msg = value as {id: number}
                resolvers.push(() => {
                    this.onmessage?.(
                        new MessageEvent("message", {
                            data: {id: msg.id, type: "success", value: new Blob()},
                        }),
                    )

                    return undefined
                })

                return undefined
            }

            terminate(): undefined {
                return undefined
            }
        }

        globalThis.Worker = _FakeWorker as unknown as typeof Worker
        URL.createObjectURL = () => "blob:dcim"
        URL.revokeObjectURL = () => undefined

        try {
            const pool = createWorkerPool(dcim().png().compile(), {
                workers: 2,
                waterfall: 1,
            })

            const p1 = pool.run(new Blob())
            const p2 = pool.run(new Blob())
            const p3 = pool.run(new Blob())

            expect(workerMessages[0]!.length + workerMessages[1]!.length).toBe(3)
            expect(workerMessages[0]!.length).toBe(2)
            expect(workerMessages[1]!.length).toBe(1)

            const r = resolvers.splice(0)
            for (const resolve of r) {
                resolve()
            }

            await Promise.all([p1, p2, p3])
        } finally {
            globalThis.Worker = previousWorker
            URL.createObjectURL = previousCreateObjectURL
            URL.revokeObjectURL = previousRevokeObjectURL
        }
    })
})
