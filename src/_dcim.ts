import {compile} from "#src/_compiler"

/** Resize an image to one or both target dimensions. */
export interface ResizeOperation {
    type: "ResizeOperation"
    width: number | null
    height: number | null
    fit: "cover" | "contain" | "fill"
    aspect?: number
}

/** Convert an image to a target output format and quality. */
export interface ConvertOperation {
    type: "ConvertOperation"
    format: "png" | "jpeg" | "webp" | "avif"
    quality: number
}

/** Options for resize operations. */
export type ResizeOptions = Omit<Partial<ResizeOperation>, "type" | "width" | "height">

/** An image transformation operation. */
export type Operation = ResizeOperation | ConvertOperation

/** Fluent immutable builder for DCIM image transformation pipelines. */
export class DCIM {
    readonly operations: readonly Operation[]

    constructor(operations: readonly Operation[] = []) {
        this.operations = operations
    }

    /**
     * Add a resize operation.
     *
     * When `options.aspect` is provided with one `null` dimension, the missing
     * dimension is calculated from the requested aspect ratio.
     */
    resize(width: null, height: number, options?: ResizeOptions): DCIM
    resize(width: number, height: null, options?: ResizeOptions): DCIM
    resize(width: number, height: number, options?: ResizeOptions): DCIM
    resize(width: number | null, height: number | null, options?: ResizeOptions): DCIM {
        return this._append({
            fit: "cover",
            height,
            type: "ResizeOperation",
            width,
            ...options,
        })
    }

    /** Add a PNG conversion operation. */
    png(): DCIM {
        return this._append({
            format: "png",
            quality: 100,
            type: "ConvertOperation",
        })
    }

    /** Add a JPEG conversion operation. */
    jpeg(quality: number = 100): DCIM {
        return this._append({
            format: "jpeg",
            quality,
            type: "ConvertOperation",
        })
    }

    /** Add a WebP conversion operation. */
    webp(quality: number = 100): DCIM {
        return this._append({
            format: "webp",
            quality,
            type: "ConvertOperation",
        })
    }

    /** Add an AVIF conversion operation. */
    avif(quality: number = 100): DCIM {
        return this._append({
            format: "avif",
            quality,
            type: "ConvertOperation",
        })
    }

    /** Compile the pipeline into deterministic JavaScript source code. */
    compile(): string {
        return compile(this.operations)
    }

    private _append(operation: Operation): DCIM {
        return new DCIM([...this.operations, operation])
    }
}
