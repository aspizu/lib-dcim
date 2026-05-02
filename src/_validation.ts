/** Validate that a number is an integer inside an inclusive range. */
export function _assertIntegerInRange(
    name: string,
    value: number,
    min: number,
    max: number,
): undefined {
    if (!Number.isInteger(value) || value < min || value > max) {
        throw new Error(`${name} must be an integer between ${min} and ${max}`)
    }

    return undefined
}

/** Validate that a number is a positive integer. */
export function _assertPositiveInteger(name: string, value: number): undefined {
    if (!Number.isInteger(value) || value <= 0) {
        throw new Error(`${name} must be a positive integer`)
    }

    return undefined
}

/** Validate that a number is finite and positive. */
export function _assertPositiveNumber(name: string, value: number): undefined {
    if (!Number.isFinite(value) || value <= 0) {
        throw new Error(`${name} must be a positive number`)
    }

    return undefined
}
