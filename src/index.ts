export {compile} from "#src/_compiler"
export {createWorker, type ImageInput, type WorkerProcessor} from "#src/_workers"
export * from "#src/_dcim"
import {DCIM} from "#src/_dcim"

/** Create an empty DCIM image transformation pipeline. */
export function dcim(): DCIM {
    return new DCIM()
}
