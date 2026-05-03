import type {ImageInput} from "./_workers"
import {_WorkerProcessor} from "./_workers"

/** Options for configuring a worker pool. */
export interface WorkerPoolOptions {
    /** Number of worker threads to spawn. Defaults to 1. */
    workers?: number
    /** Maximum number of jobs to queue per worker before routing to the next. Defaults to Infinity. */
    jobsPerWorker?: number
    /** Maximum number of jobs a worker can process concurrently (waterfall depth). Defaults to Infinity. */
    waterfall?: number
}

/** A pool of reusable DCIM worker processors. */
export interface WorkerPool {
    /** Release all underlying Workers and Blob URLs. */
    dispose(): undefined

    /** Run the compiled DCIM pipeline for an image, routing to the least-loaded worker. */
    run(image: ImageInput): Promise<Blob>
}

/**
 * Create a pool of Worker-backed processors for compiled DCIM JavaScript.
 *
 * Jobs are distributed round-robin, respecting `jobsPerWorker` and `waterfall` limits.
 * Reuse one pool for batches of images, then call `dispose()` when it is no longer needed.
 *
 * @param code - Compiled DCIM JavaScript to run in workers.
 * @param options - Pool configuration options.
 */
export function createWorkerPool(
    code: string,
    options: WorkerPoolOptions = {},
): WorkerPool {
    return new _WorkerPool(code, options)
}

class _WorkerPool implements WorkerPool {
    private readonly _processors: _WorkerProcessor[]
    private readonly _jobsPerWorker: number
    private readonly _waterfall: number
    private _index = 0

    constructor(code: string, options: WorkerPoolOptions) {
        const count = options.workers ?? 1
        this._jobsPerWorker = options.jobsPerWorker ?? Infinity
        this._waterfall = options.waterfall ?? Infinity
        this._processors = Array.from({length: count}, () => new _WorkerProcessor(code))
    }

    dispose(): undefined {
        for (const p of this._processors) {
            p.dispose()
        }

        return undefined
    }

    run(image: ImageInput): Promise<Blob> {
        const start = this._index
        const n = this._processors.length

        for (let i = 0; i < n; i++) {
            const idx = (start + i) % n
            const p = this._processors[idx]!

            if (p.active < this._waterfall && p.queued < this._jobsPerWorker) {
                this._index = (idx + 1) % n
                return p.run(image)
            }
        }

        const idx = start % n
        this._index = (idx + 1) % n
        return this._processors[idx]!.run(image)
    }
}
