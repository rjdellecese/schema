/**
 * @since 1.0.0
 */

import * as Effect from "effect/Effect"
import * as Either from "effect/Either"
import * as Option from "effect/Option"
import type * as ReadonlyArray from "effect/ReadonlyArray"
import type * as AST from "./AST.js"

/**
 * @since 1.0.0
 */
export interface ParseResult<A> extends Effect.Effect<never, ParseError, A> {}

/**
 * @since 1.0.0
 */
export interface ParseError {
  readonly _tag: "ParseError"
  readonly errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
}

/**
 * @since 1.0.0
 */
export const parseError = (
  errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
): ParseError => ({
  _tag: "ParseError",
  errors
})

/**
 * `ParseErrors` is a type that represents the different types of errors that can occur when decoding a value.
 *
 * @category model
 * @since 1.0.0
 */
export type ParseErrors =
  | Type
  | Index
  | Key
  | Missing
  | Unexpected
  | UnionMember
  | Forbidden

/**
 * The `Type` variant of the `ParseError` type represents an error that occurs when the `actual` value is not of the expected type.
 * The `expected` field specifies the expected type, and the `actual` field contains the value that caused the error.
 * This error can occur when trying to decode a value using a schema that is only able to decode values of a specific type,
 * and the actual value is not of that type. For example, if you are using a schema to decode a string value and the actual value
 * is a number, a `Type` decode error would be returned.
 *
 * @category model
 * @since 1.0.0
 */
export interface Type {
  readonly _tag: "Type"
  readonly expected: AST.AST
  readonly actual: unknown
  readonly message: Option.Option<string>
}

/**
 * The `Forbidden` variant of the `ParseError` type represents an error that occurs when an Effect is encounter but disallowed from execution.
 *
 * @category model
 * @since 1.0.0
 */
export interface Forbidden {
  readonly _tag: "Forbidden"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const type = (expected: AST.AST, actual: unknown, message?: string): Type => ({
  _tag: "Type",
  expected,
  actual,
  message: Option.fromNullable(message)
})

/**
 * @category constructors
 * @since 1.0.0
 */
export const forbidden: Forbidden = {
  _tag: "Forbidden"
}

/**
 * The `Index` decode error indicates that there was an error at a specific index in an array or tuple.
 * The `errors` field contains the decode errors for that index. This error is typically used when decoding an array or tuple
 * with a schema that has constraints on the elements. For example, you might use an `Index` decode error to indicate
 * that a specific element in an array did not match the expected type or value.
 *
 * @category model
 * @since 1.0.0
 */
export interface Index {
  readonly _tag: "Index"
  readonly index: number
  readonly errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const index = (
  index: number,
  errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
): Index => ({ _tag: "Index", index, errors })

/**
 * The `Key` variant of the `ParseError` type represents an error that occurs when a key in an object is invalid.
 * This error typically occurs when the `actual` value is not a valid key type (e.g. a string or number)
 * or when the key is not present in the object being decoded. In either case, the `key` field of the error will contain
 * the invalid key value. This error is typically used in combination with the `Unexpected` error,
 * which indicates that an unexpected key was found in the object being decoded.
 *
 * @category model
 * @since 1.0.0
 */
export interface Key {
  readonly _tag: "Key"
  readonly key: PropertyKey
  readonly errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const key = (
  key: PropertyKey,
  errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
): Key => ({ _tag: "Key", key, errors })

/**
 * Error that occurs when a required key or index is missing.
 *
 * @category model
 * @since 1.0.0
 */
export interface Missing {
  readonly _tag: "Missing"
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const missing: Missing = { _tag: "Missing" }

/**
 * Error that occurs when an unexpected key or index is present.
 *
 * @category model
 * @since 1.0.0
 */
export interface Unexpected {
  readonly _tag: "Unexpected"
  readonly actual: unknown
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const unexpected = (
  actual: unknown
): Unexpected => ({ _tag: "Unexpected", actual })

/**
 * Error that occurs when a member in a union has an error.
 *
 * @category model
 * @since 1.0.0
 */
export interface UnionMember {
  readonly _tag: "UnionMember"
  readonly errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
}

/**
 * @category constructors
 * @since 1.0.0
 */
export const unionMember = (
  errors: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
): UnionMember => ({ _tag: "UnionMember", errors })

/**
 * @category constructors
 * @since 1.0.0
 */
export const success: <A>(a: A) => ParseResult<A> = Either.right

/**
 * @category constructors
 * @since 1.0.0
 */
export const fail: (error: ParseError) => ParseResult<never> = Either.left

/**
 * @category constructors
 * @since 1.0.0
 */
export const failure = (e: ParseErrors): ParseResult<never> => fail(parseError([e]))

/**
 * @category constructors
 * @since 1.0.0
 */
export const failures = (
  es: ReadonlyArray.NonEmptyReadonlyArray<ParseErrors>
): ParseResult<never> => Either.left(parseError(es))

/**
 * @category optimisation
 * @since 1.0.0
 */
export const eitherOrUndefined = <A>(
  self: ParseResult<A>
): Either.Either<ParseError, A> | undefined => {
  const s: any = self
  if (s["_tag"] === "Left" || s["_tag"] === "Right") {
    return s
  }
}

/**
 * @category optimisation
 * @since 1.0.0
 */
export const flatMap = <A, B>(
  self: ParseResult<A>,
  f: (self: A) => ParseResult<B>
): ParseResult<B> => {
  const s: any = self
  if (s["_tag"] === "Left") {
    return s
  }
  if (s["_tag"] === "Right") {
    return f(s.right)
  }
  return Effect.flatMap(self, f)
}

/**
 * @category optimisation
 * @since 1.0.0
 */
export const map = <A, B>(self: ParseResult<A>, f: (self: A) => B): ParseResult<B> => {
  const s: any = self
  if (s["_tag"] === "Left") {
    return s
  }
  if (s["_tag"] === "Right") {
    return Either.right(f(s.right))
  }
  return Effect.map(self, f)
}

/**
 * @category optimisation
 * @since 1.0.0
 */
export const mapLeft = <A>(
  self: ParseResult<A>,
  f: (error: ParseError) => ParseError
): ParseResult<A> => {
  const s: any = self
  if (s["_tag"] === "Left") {
    return Either.left(f(s.left))
  }
  if (s["_tag"] === "Right") {
    return s
  }
  return Effect.mapError(self, f)
}

/**
 * @category optimisation
 * @since 1.0.0
 */
export const bimap = <A, B>(
  self: ParseResult<A>,
  f: (error: ParseError) => ParseError,
  g: (a: A) => B
): ParseResult<B> => {
  const s: any = self
  if (s["_tag"] === "Left") {
    return Either.left(f(s.left))
  }
  if (s["_tag"] === "Right") {
    return Either.right(g(s.right))
  }
  return Effect.mapBoth(self, { onFailure: f, onSuccess: g })
}

/**
 * @category optimisation
 * @since 1.0.0
 */
export const orElse = <A>(
  self: ParseResult<A>,
  f: (error: ParseError) => ParseResult<A>
): ParseResult<A> => {
  const s: any = self
  if (s["_tag"] === "Left") {
    return f(s.left)
  }
  if (s["_tag"] === "Right") {
    return s
  }
  return Effect.catchAll(self, f)
}
