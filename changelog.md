# 1.0.7

- Unpin `@bufbuild/protobuf` dependency

# 1.0.6

- Added missed name for `protobufParser` export

# 1.0.5

- Added `protobufParser` export for use `{ parser: "protobuf" }` to parse body as `Uint8Array` without other logic. It also helps remove duplication protobuf configuration in nested `group` (check [tests/instances.test.ts](./tests/instances.test.ts) for example)

# 1.0.4

- Fixed name matching for `ElysiaCustomStatusResponse` in minified build (in #3)

# 1.0.3

- Added support return with elysia status function (#2 in #1)
- Added support return with Response (before responding, the body is parsed as JSON and converted to the desired schema)
- Bump depends

# 1.0.2

- Replaced `.as("plugin")` to `.as("scoped")` in core (breaking changes from elysia 1.3.0)
- Bump depends

# 1.0.1

- Fix typo in README

# 1.0.0

- Initial release
