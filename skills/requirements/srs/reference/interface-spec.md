# Interface specs

An interface spec is a contract other code builds against: a plugin API, a connector contract, a
message schema, a public HTTP API. It lives in `docs/srs/interfaces/<name>.md` and is listed in the
README's Areas section with its version.

Unlike an area file, the exact shape is the requirement. A row may name a type, a field, a status code
or a method signature, because that is what the other side depends on.

## Layout

```
# <Name> interface

Version 1.2.0. Consumers: <who builds against it>.

## Versioning

Major: a change that breaks an existing consumer. Minor: an addition an existing consumer can ignore.
Patch: wording only.

## <Part> (<SUB>)

| ID | Requirement | Pri | Verify | Status |
|---|---|---|---|---|
| CONN-API-01 | `start(config: ConnectorConfig): Promise<void>` resolves once the connector accepts messages. | P1 | Test | Accepted |
| CONN-API-02 | `start` rejects with `ConfigError` when `config.port` is outside 1 to 65535. | P1 | Test | Accepted |

## Version history

- 1.2.0 (2026-11-24): added CONN-API-07.
```

## Rules

- IDs follow the SRS format with the interface's own area code.
- Every row says one observable fact about the contract: a signature, a field and its type, an error
  and when it occurs, an ordering or timing guarantee.
- A breaking change bumps the major version. The changed rows get new IDs, and the old rows become
  `Superseded by <new ID>` when the developer accepts the change. Note the version in the change log.
- Errors and limits are part of the contract. A spec that lists only the happy path is incomplete.
- Name the consumers. The domain and scope reviewers of a debate need to know who breaks.
