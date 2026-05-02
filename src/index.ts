export {compile} from "./_compiler"
export * from "./_dcim"
export {createWorker, type ImageInput, type WorkerProcessor} from "./_workers"
import {DCIM} from "./_dcim"

/** Create an empty DCIM image transformation pipeline. */
export function dcim(): DCIM {
    return new DCIM()
}
