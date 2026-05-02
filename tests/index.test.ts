import {compile, dcim, type Operation} from "#src/index"

import {_loadEncode, _loadTransform} from "./_fake-canvas"

describe("compile", () => {
    it("compiles dependency-free canvas JavaScript", () => {
        const code = dcim().resize(480, 360, {fit: "cover"}).webp(82).compile()

        expect(code).toContain("export default function transform(image)")
        expect(code).toContain("export async function encode(image)")
        expect(code).toContain("output = _resizeCover(output, 480, 360)")
        expect(code).toContain('return await _encode(canvas, "image/webp", 0.82)')
        expect(code).toContain("context.drawImage(source, (sourceWidth - sw) / 2")
    })

    it("executes generated resize transformations with canvas", async () => {
        const transform = await _loadTransform(
            dcim().resize(2, 2, {fit: "cover"}).compile(),
        )
        const output = transform({height: 2, width: 4})

        expect(output.width).toBe(2)
        expect(output.height).toBe(2)
        expect(output.calls.at(-1)).toEqual([
            "drawImage",
            expect.objectContaining({height: 2, width: 4}),
            1,
            0,
            2,
            2,
            0,
            0,
            2,
            2,
        ])
    })

    it("executes generated encoders with canvas", async () => {
        const encode = await _loadEncode(dcim().resize(2, 2).jpeg(75).compile())
        const blob = await encode({height: 2, width: 2})

        expect(blob.type).toBe("image/jpeg")
    })

    it("omits null resize dimensions", () => {
        expect(dcim().resize(null, 360, {fit: "contain"}).compile()).toContain(
            "output = _resizeContain(output, null, 360)",
        )
        expect(dcim().resize(480, null, {fit: "fill"}).compile()).toContain(
            "output = _resizeFill(output, 480, null)",
        )
    })

    it("calculates missing resize dimensions from aspect ratio", () => {
        expect(
            dcim()
                .resize(null, 360, {aspect: 16 / 9})
                .compile(),
        ).toContain("output = _resizeCover(output, 640, 360)")
        expect(
            dcim()
                .resize(640, null, {aspect: 16 / 9})
                .compile(),
        ).toContain("output = _resizeCover(output, 640, 360)")
    })

    it("emits specialized resize calls without runtime options objects", () => {
        const code = dcim()
            .resize(300, 200, {fit: "cover"})
            .resize(300, 200, {fit: "contain"})
            .resize(300, 200, {fit: "fill"})
            .compile()

        expect(code).toContain("output = _resizeCover(output, 300, 200)")
        expect(code).toContain("output = _resizeContain(output, 300, 200)")
        expect(code).toContain("output = _resizeFill(output, 300, 200)")
        expect(code).not.toContain("fit:")
    })

    it("omits conversion operations from the transform hot path", () => {
        const code = dcim().webp(82).compile()

        expect(code).not.toContain("output = _source(output)")
        expect(code).toContain('return await _encode(canvas, "image/webp", 0.82)')
    })

    it("does not mutate previous builder instances", () => {
        const base = dcim()
        const resized = base.resize(480, 360)

        expect(base.compile()).not.toContain("output = _resize")
        expect(resized.compile()).toContain("output = _resizeCover(output, 480, 360)")
    })

    it("rejects invalid resize dimensions", () => {
        expect(() => dcim().resize(0, 360).compile()).toThrow(
            "width must be a positive integer",
        )
    })

    it("rejects invalid resize aspect ratios", () => {
        expect(() => dcim().resize(640, null, {aspect: 0}).compile()).toThrow(
            "aspect must be a positive number",
        )
    })

    it("rejects resize operations without dimensions", () => {
        const operations: Operation[] = [
            {fit: "cover", height: null, type: "ResizeOperation", width: null},
        ]

        expect(() => compile(operations)).toThrow(
            "ResizeOperation requires at least one dimension",
        )
    })

    it("rejects invalid conversion quality", () => {
        expect(() => dcim().jpeg(101).compile()).toThrow(
            "quality must be an integer between 1 and 100",
        )
    })
})
