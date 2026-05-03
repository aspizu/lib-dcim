import {createWorkerPool, dcim} from "../src/index"

describe("worker pool", () => {
    it("creates a worker pool that distributes jobs across workers", async () => {
        const previousWorker = globalThis.Worker
        const previousCreateObjectURL = URL.createObjectURL
        const previousRevokeObjectURL = URL.revokeObjectURL
        const workerMessages: unknown[][] = []
        const terminated: boolean[] = []

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
                terminated.push(false)
            }

            postMessage(value: unknown): undefined {
                workerMessages[this._idx]!.push(value)
                const msg = value as {id: number}
                this.onmessage?.(
                    new MessageEvent("message", {
                        data: {id: msg.id, type: "success", value: new Blob()},
                    }),
                )

                return undefined
            }

            terminate(): undefined {
                terminated[this._idx] = true

                return undefined
            }
        }

        globalThis.Worker = _FakeWorker as unknown as typeof Worker
        URL.createObjectURL = () => "blob:dcim"
        URL.revokeObjectURL = () => undefined

        try {
            const pool = createWorkerPool(dcim().png().compile(), {workers: 2})
            await pool.run(new Blob())
            await pool.run(new Blob())
            await pool.run(new Blob())
            pool.dispose()

            expect(workerMessages[0]!.length).toBe(2)
            expect(workerMessages[1]!.length).toBe(1)
            expect(terminated).toEqual([true, true])
        } finally {
            globalThis.Worker = previousWorker
            URL.createObjectURL = previousCreateObjectURL
            URL.revokeObjectURL = previousRevokeObjectURL
        }
    })
})
