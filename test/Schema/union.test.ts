import * as S from "@effect/schema/Schema"
import * as Util from "@effect/schema/test/util"
import { describe, it } from "vitest"

describe("Schema/literal", () => {
  describe("decoding", () => {
    it("empty union", async () => {
      const schema = S.union()
      await Util.expectParseFailure(schema, 1, "Expected never, actual 1")
    })

    it("members with literals but the input doesn't have any", async () => {
      const schema = S.union(
        S.struct({ a: S.literal(1), c: S.string }),
        S.struct({ b: S.literal(2), d: S.number })
      )
      await Util.expectParseFailure(
        schema,
        null,
        "Expected a generic object, actual null"
      )
      await Util.expectParseFailure(schema, {}, "/a is missing, /b is missing")
      await Util.expectParseFailure(
        schema,
        { a: null },
        `/a Expected 1, actual null, /b is missing`
      )
      await Util.expectParseFailure(schema, { b: 3 }, `/a is missing, /b Expected 2, actual 3`)
    })

    it("members with multiple tags", async () => {
      const schema = S.union(
        S.struct({ category: S.literal("catA"), tag: S.literal("a") }),
        S.struct({ category: S.literal("catA"), tag: S.literal("b") }),
        S.struct({ category: S.literal("catA"), tag: S.literal("c") })
      )
      await Util.expectParseFailure(
        schema,
        null,
        "Expected a generic object, actual null"
      )
      await Util.expectParseFailure(schema, {}, "/category is missing, /tag is missing")
      await Util.expectParseFailure(
        schema,
        { category: null },
        `/category Expected "catA", actual null, /tag is missing`
      )
      await Util.expectParseFailure(
        schema,
        { tag: "d" },
        `/category is missing, /tag Expected "b" or "c", actual "d"`
      )
    })

    it("union/required property signatures: should return the best output", async () => {
      const a = S.struct({ a: S.string })
      const ab = S.struct({ a: S.string, b: S.number })
      const schema = S.union(a, ab)
      await Util.expectParseSuccess(schema, { a: "a", b: 1 })
    })

    it("union/optional property signatures: should return the best output", async () => {
      const ab = S.struct({ a: S.string, b: S.optional(S.number) })
      const ac = S.struct({ a: S.string, c: S.optional(S.number) })
      const schema = S.union(ab, ac)
      await Util.expectParseSuccess(
        schema,
        { a: "a", c: 1 },
        { a: "a" }
      )
      await Util.expectParseSuccess(
        schema,
        { a: "a", c: 1 },
        { a: "a", c: 1 },
        Util.onExcessPropertyError
      )
    })
  })

  describe("encoding", () => {
    // raises an error while encoding from a number if the string is not a char
    const NumberFromChar = S.string.pipe(S.length(1), S.numberFromString)

    it("union", async () => {
      const schema = S.union(S.string, NumberFromChar)
      await Util.expectEncodeSuccess(schema, "a", "a")
      await Util.expectEncodeSuccess(schema, 1, "1")
    })

    it("union/ more required property signatures", async () => {
      const a = S.struct({ a: S.string })
      const ab = S.struct({ a: S.string, b: S.number })
      const schema = S.union(a, ab)
      await Util.expectEncodeSuccess(schema, { a: "a", b: 1 }, { a: "a", b: 1 })
    })

    it("union/ optional property signatures", async () => {
      const ab = S.struct({ a: S.string, b: S.optional(S.number) })
      const ac = S.struct({ a: S.string, c: S.optional(S.number) })
      const schema = S.union(ab, ac)
      await Util.expectEncodeSuccess(
        schema,
        { a: "a", c: 1 },
        { a: "a" }
      )
      await Util.expectEncodeSuccess(
        schema,
        { a: "a", c: 1 },
        { a: "a", c: 1 },
        Util.onExcessPropertyError
      )
    })
  })
})
