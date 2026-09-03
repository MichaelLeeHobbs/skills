---
name: oie-plugin-development
description: >-
  Develop, scaffold, and build a plugin/extension for Open Integration Engine (OIE) or Mirth Connect.
  Use when creating a new OIE/Mirth plugin, setting up its Maven project (root/module POMs), writing the
  plugin.xml descriptor, implementing server-side or client-side (Administrator GUI) plugin classes, building
  a source/destination connector (subclassing a stock connector, settings panel, TLS-plugin compatibility),
  adding a REST servlet endpoint, doing database migrations (Migrator + MyBatis), handling permissions/event
  logging/XStream serialization, or packaging/signing the plugin .zip. NOT for engine-core changes or for
  channel/template JavaScript.
---

# OIE / Mirth plugin development

Build a plugin (extension) for the Open Integration Engine (OIE), the open-source fork of Mirth Connect.
The detail lives in [`reference/`](./reference/), loaded on demand. This file is the map. Read the
reference for the task at hand rather than pulling in the whole guide.

> **Credit:** this skill is adapted from the **OIE Plugin Development Guide by
> [@pacmano1](https://github.com/pacmano1)**. The hard-won knowledge here is his. Thank you.

## First, the thing that surprises people

Plugins build with **Maven** (root POM plus module POMs), even though the **engine itself builds with
Gradle**. It migrated off Ant in June 2026, so older guides still say Ant. Use the Maven workflow below
for plugin work. You never build the engine to build a plugin, because its artifacts come from a Maven
repo. See [`reference/maven-poms.md`](./reference/maven-poms.md).

## Shape of a plugin

A plugin is a multi-module Maven project that produces an installable `.zip`:

- **server** module, the classes the engine instantiates: services, REST servlets, migrators.
- **client** module, the classes the **Administrator** GUI instantiates: panels, settings.
- **shared** module, types used by both.
- a **`plugin.xml`** descriptor wiring it together, and a **packaging/assembly** step that zips it.

## Where to go

Numbered in the order a new plugin usually needs them. Jump straight to a row if you already know the
task. Read [`gotchas-and-example.md`](./reference/gotchas-and-example.md) early rather than at the end.

| # | I am trying to | Reference |
|---|---|---|
| 1 | Scaffold a new plugin, understand the layout, check prerequisites | [`project-structure.md`](./reference/project-structure.md) |
| 2 | Write or fix the root and module POMs, or find the build command | [`maven-poms.md`](./reference/maven-poms.md) |
| 3 | Configure `plugin.xml`: classes, resources, version | [`plugin-descriptor.md`](./reference/plugin-descriptor.md) |
| 4 | Add a server service, a REST endpoint, permissions, or event logging | [`server-plugin.md`](./reference/server-plugin.md) |
| 5 | Add an Administrator-GUI panel or a shared type | [`client-and-shared.md`](./reference/client-and-shared.md) |
| 6 | Add or alter a table (Migrator), or a query (MyBatis) | [`database.md`](./reference/database.md) |
| 7 | Build the `.zip`, sign it including the Administrator Launcher signing wall, or serialize with XStream | [`packaging-signing-serialization.md`](./reference/packaging-signing-serialization.md) |
| 8 | Debug a weird build or runtime problem, or read a full tiny example | [`gotchas-and-example.md`](./reference/gotchas-and-example.md) |
| | Build a **source or destination connector**: subclass a stock one, settings panel, TLS-plugin compatibility, live testing | [`connector-plugins.md`](./reference/connector-plugins.md) |

A connector has no number because it is a different shape rather than a step in the sequence. It brings
its own descriptor, its own settings panel, and its own lessons about styling and live testing.

## Notes

- Most references are pacmano1's guide text split by topic, and each has a footer linking back to the source.
  `connector-plugins.md` and the Administrator-Launcher signing section are field notes from building a
  connector, additions to the original guide rather than from it.
- This skill covers building the plugin. JavaScript that runs *inside a channel*, meaning transformers,
  filters and code templates, is a different runtime (Rhino) with different rules. That is the companion
  [`oie-channel-code-review`](../oie-channel-code-review/) skill.

## It is working if

`mvn package` produces a `.zip` the Administrator installs without a signing complaint, the plugin
appears in the extension list after a server restart, and its server and client classes both load, which
you confirm in the server log rather than by the install succeeding. If the plugin runs a migrator, the
table exists at the new schema version.
