# Types: mapping each language onto the closed lists

The tool compares only the closed values. Map every field with this file; anything you cannot map is
`unknown` (type) or `unknown` (presence, nullability), and `diff` turns it into an UNRESOLVED cell
instead of a guess.

## Type

| Closed type | TypeScript | Java, Kotlin | C# | Python | Spec (JSON Schema, OpenAPI) |
|---|---|---|---|---|---|
| `string` | `string`, string literal | `String`, `UUID`, `CharSequence` | `string`, `Guid` | `str`, `UUID` | `type: string` with no date format |
| `int32` | | `int`, `Integer`, `Int` | `int` | | `format: int32` |
| `int53` | an integer branded type, `z.number().int()` | | | | `type: integer` with no format |
| `int64` | | `long`, `Long` | `long` | | `format: int64` |
| `bigint` | `bigint` | `BigInteger` | `BigInteger` | `int` | |
| `decimal` | | `BigDecimal` | `decimal` | `Decimal` | `format: decimal` |
| `number` | `number` | `double`, `float`, `Double` | `double`, `float` | `float` | `type: number` |
| `boolean` | `boolean` | `boolean`, `Boolean` | `bool` | `bool` | `type: boolean` |
| `date` | | `Instant`, `OffsetDateTime`, `LocalDateTime`, `Date` (wire form set by `date_write`) | `DateTime`, `DateTimeOffset` | `datetime` | |
| `date-iso` | `string` documented or validated as ISO (`z.string().datetime()`) | | | | `format: date-time` |
| `date-epoch-s`, `date-epoch-ms` | `number` documented or validated as an epoch | a date field with a per-field epoch annotation | | | |
| `date-object` | `Date` | | | | |
| `enum` | a union of string literals, a string `enum`, `z.enum` | `enum` types | `enum` types | `Enum`, `Literal[...]` | `enum:` |
| `array` | `T[]`, `Array<T>` | `List`, `Set`, arrays | `List<T>`, arrays | `list`, `set` | `type: array` |
| `object` | another shape, an inline object | another class | another class | another model | `$ref`, `type: object` |
| `map` | `Record<K, V>`, index signatures | `Map` | `Dictionary` | `dict` | `additionalProperties` |
| `function` | a function type | | | `Callable` | |
| `any` | `any`, `unknown` (accepts every value) | `Object`, `JsonNode` | `object`, `JsonElement` | `Any` | `{}` |
| `unknown` | a type the parser could not resolve | | | | |

A field whose type the code writes as `string` but whose serializer writes a long as a string (a
`ToStringSerializer`, a JSON number-as-string option) is `string` on the producer.

Element types of arrays and maps are not compared. A nested shape is compared as its own shape: it has
its own rows and groups.

## Presence, nullability and validation

`presence` says whether the field may be absent from the payload; `nullable` whether it may be `null`;
`validated` whether the consumer rejects a missing value when it reads a request.

| Language | `presence` | `nullable` | `validated` `yes` when |
|---|---|---|---|
| TypeScript, zod | `?` or `.optional()` is optional, else required | `\| null`, `.nullable()` is yes; `.nullish()` is yes and optional; `\| undefined` alone is optional, nullable no | a runtime validator parses the payload (zod, yup, io-ts) |
| Kotlin | a property with a default is optional, else required | `T?` is yes, else no | non-null with no default (the deserializer rejects a missing value) |
| Java | `Optional<T>` or a field with an initializer is optional; otherwise `unknown` unless a module-level null-marking annotation applies | a primitive is no; `@Nullable` is yes; `@NonNull`, `@NotNull` is no; otherwise `unknown` | `@NotNull` or `@NotBlank` with validation enabled on the handler (`@Valid`) |
| C# | nullable reference types on: `T?` is yes; a `required` member is required; otherwise optional | with nullable reference types off, reference types are `unknown` | `[Required]` with model validation on |
| Python, pydantic | a field with no default is required, else optional | `Optional[T]` or `T \| None` is yes, else no | always yes for a pydantic consumer |
| Python dataclass, `TypedDict` | `total=False` or `NotRequired` is optional, else required | as pydantic | no |
| Spec | listed in `required` is required, else optional | `nullable: true` or a `null` type is yes, else no | no |

A module or package null-marking annotation (`@NullMarked`, `@NonNullApi`,
`@ParametersAreNonnullByDefault`) turns Java's `unknown` nullability into no for unannotated fields in
its scope; cite it on the field rows as you map them. In this table `\|` stands for a plain `|`.

## Settings

| Setting | What it changes |
|---|---|
| `naming` | the wire name of every field without an alias. `keys` applies it; Jackson, pydantic and System.Text.Json naming policies map onto these values |
| `inclusion` | `non-null` drops null fields from the payload: a nullable producer field may then be absent instead of `null` |
| `unknown_properties` | what a consumer does with a field it does not declare: `fail` rejects the payload |
| `unknown_enum` | what a server consumer does with an enum value it does not know: `fail` rejects, `null` or `default` maps it |
| `date_write` | how a `date` field is written and read: ISO text or epoch seconds or milliseconds |

A per-constant enum rename, a custom serializer on one field, and a client interceptor that renames keys
or revives dates are not settings: the judge reads them and marks the cells they explain TRANSFORMED.
