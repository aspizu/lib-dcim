import type {_WorkerErrorData} from "./_worker-source"
import {_workerSource} from "./_worker-source"

/** Image input accepted by DCIM worker processing. */
export type ImageInput = ImageBitmapSource

/** Reusable DCIM worker processor. */
export interface WorkerProcessor {
    /** Release the underlying Worker and Blob URL. */
    dispose(): undefined

    /** Run the compiled DCIM pipeline for an image and resolve the encoded Blob. */
    run(image: ImageInput): Promise<Blob>
}

interface _PendingJob {
    reject(error: Error): void
    resolve(value: Blob): void
}

interface _WorkerMessage {
    id: number
    type: "error" | "success"
    value: Blob | _WorkerErrorData
}

/**
 * Create a reusable Worker-backed processor for compiled DCIM JavaScript.
 *
 * Reuse one processor for batches of images, then call `dispose()` when it is
 * no longer needed.
 */
export function createWorker(code: string): WorkerProcessor {
    return new _WorkerProcessor(code)
}

export class _WorkerProcessor implements WorkerProcessor {
    private readonly _objectURL: string
    private readonly _pending = new Map<number, _PendingJob>()
    private readonly _worker: Worker
    private _disposed = false
    private _nextId = 0
    get queued(): number {
        return this._pending.size
    }

    constructor(code: string) {
        const blob = new Blob([_workerSource(code)], {type: "application/javascript"})
        this._objectURL = URL.createObjectURL(blob)
        this._worker = new Worker(this._objectURL, {type: "module"})
        this._worker.onmessage = (event: MessageEvent<_WorkerMessage>) => {
            this._handleMessage(event.data)
        }
        this._worker.onerror = (event: ErrorEvent) => {
            this._rejectAll(new Error(event.message))
        }
    }

    dispose(): undefined {
        if (this._disposed) {
            return undefined
        }

        this._disposed = true
        this._worker.terminate()
        URL.revokeObjectURL(this._objectURL)
        this._rejectAll(new Error("Worker processor has been disposed"))

        return undefined
    }

    run(image: ImageInput): Promise<Blob> {
        if (this._disposed) {
            return Promise.reject(new Error("Worker processor has been disposed"))
        }

        const id = this._nextId
        this._nextId += 1

        return new Promise<Blob>((resolve, reject) => {
            this._pending.set(id, {reject, resolve})
            this._worker.postMessage({id, image})
        })
    }

    private _handleMessage(message: _WorkerMessage): undefined {
        const pending = this._pending.get(message.id)

        if (pending === undefined) {
            return undefined
        }

        this._pending.delete(message.id)

        if (message.type === "error") {
            const data = message.value as _WorkerErrorData
            const error = new Error(data.message)
            error.stack = data.stack
            pending.reject(error)
            return undefined
        }

        pending.resolve(message.value as Blob)
        return undefined
    }

    private _rejectAll(error: Error): undefined {
        for (const pending of this._pending.values()) {
            pending.reject(error)
        }

        this._pending.clear()

        return undefined
    }
}
