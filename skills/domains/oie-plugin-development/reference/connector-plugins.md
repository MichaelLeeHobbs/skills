## Building a connector (source / destination) plugin

A **connector** is a different kind of plugin from the service/servlet plugins the rest of this skill
describes. These are field notes from building a production destination connector (a multi-endpoint TCP
sender) against OIE 4.5.2 — the pacmano1 guide doesn't cover connectors, so start here for that case.

### Shape (differs from a service plugin)

A connector is three classes wired by a **connector descriptor XML** — `source.xml` / `destination.xml`
(a `ConnectorMetaData`), *not* `plugin.xml`:

- **shared** — `…ConnectorProperties` (extend the stock properties, or `ConnectorProperties`): the
  serialized settings object.
- **server** — the `SourceConnector` / `DestinationConnector` (e.g. a `*Dispatcher` / `*Receiver`).
- **client** — a `ConnectorSettingsPanel` (the source/destination settings UI).

Two things that silently break a connector if you get them wrong:
- Put your classes under `com.mirth.connect.connectors.<name>`. XStream **auto-allows**
  `com.mirth.connect.connectors.**`, so you skip the `allowTypes()` registration entirely.
- The descriptor `<name>` must **exactly** equal `ConnectorProperties.getName()`. If it doesn't, the channel
  won't bind the connector — the destination is dropped and the channel deploys source-only, with no error.

### Extend a stock connector — don't reimplement it

To add behavior to TCP/HTTP/etc., **subclass the stock connector and override only what you must**; let
`super` do the real I/O. For the TCP sender we overrode only `send()` (endpoint selection + failover) and
`replaceConnectorProperties()`; all socket lifecycle, MLLP framing, TLS, and keep-alive came from
`super.send()`.

**Keep `getProtocol()` unchanged.** The engine resolves per-connector hooks by the **protocol string**.
SSL/TLS is the big one:

```java
// stock TcpDispatcher.getConfigurationClass()  — inherited, do NOT override
configurationController.getProperty(connectorProperties.getProtocol(), "tcpConfigurationClass");
```

Because our properties keep `getProtocol()` = `"TCP"` and we delegate socket creation to `super`, a
third-party TLS plugin that registers `saveProperty("TCP", "tcpConfigurationClass", …)` (e.g. NovaMap's TLS
Manager) is picked up **transparently** — none of our code is involved. Override the protocol and you
silently lose TLS-plugin compatibility.

**Override-signature narrowing:** a stock override may *narrow* the `throws` clause (e.g.
`TcpDispatcher.send` drops `InterruptedException`). Your override then can't declare it either — on
interrupt, `Thread.currentThread().interrupt()` and return a QUEUED/ERROR response instead of rethrowing.

### Properties: clone, copy-ctor, and the dirty-check

The Administrator's "unsaved changes?" check compares `getProperties()` to the saved copy with
**reflection-equals**. So:

- `clone()` / the copy-constructor must **deep-copy** your fields — lists especially.
- **Compensate stock copy-ctor omissions.** `TcpDispatcherProperties`' copy-constructor drops
  `maxConnections`; our copy-ctor re-sets it, or the clone ≠ the original and the panel is "always dirty"
  (and a field silently resets).
- Add unit tests: `clone().equals(original)` **and** a serialize → deserialize → `equals` round-trip.

### Match the stock panel's look (users expect it)

A connector settings panel sits right next to the stock ones, so it has to match them:

- **Right-aligned `Label:` + Yes/No `MirthRadioButton` pairs** for booleans — not a row of checkboxes. Put a
  related checkbox inline after its field (e.g. `Ignore Response` next to `Response Timeout`).
- `MirthRadioButton` / `MirthCheckBox` render with a **gray** fill on a white panel. Call
  `setBackground(Color.WHITE)` on each (and on the panel).
- Style every table like the rest of OIE:
  ```java
  table.putClientProperty("terminateEditOnFocusLost", Boolean.TRUE);
  table.setRowHeight(UIConstants.ROW_HEIGHT);
  table.setSortable(false);
  table.setDragEnabled(false);
  table.getTableHeader().setReorderingAllowed(false);
  table.setShowGrid(true, true);
  table.setSelectionMode(ListSelectionModel.SINGLE_SELECTION);
  table.setCustomEditorControls(true);
  if (Preferences.userNodeForPackage(Mirth.class).getBoolean("highlightRows", true)) {
      table.setHighlighters(HighlighterFactory.createAlternateStriping(
          UIConstants.HIGHLIGHTER_COLOR, UIConstants.BACKGROUND_COLOR));
  }
  ```
  …and set the scroll **viewport** white, or the empty area below the last row shows Swing gray:
  `scrollPane.getViewport().setBackground(Color.WHITE);`
- `setToolTipText(...)` on every field (use `<html>…</html>` for multi-line).
- Gray out dependent fields to mirror stock (e.g. Send Timeout disabled unless Keep-Connection-Open = Yes).
- **Reuse the transmission-mode SPI** (`TransmissionMode*` public API) for the MLLP/Basic sub-panel. The
  stock TCP sender's *other* sub-panels (remote/local address, Test Connection, server mode) are `private`
  and cannot be reused — rebuild only what you actually need.

### Test the connector live (deterministic, CI-able)

Unit tests can't prove socket behavior. Stand up the real thing:

- **Docker OIE** — pin the tag (`openintegrationengine/engine:<version>`, **not** `:latest`, which floats to
  the next release) — with your built zip mounted at `/opt/engine/custom-extensions/` (the entrypoint
  auto-installs any `.zip` there on boot).
- A **controllable sink** — a tiny zero-dependency listener you can command to ACK / NACK / hang / go down —
  as the test oracle.
- A **REST driver** that logs in (`POST /api/users/_login`, header `X-Requested-With` required), deploys a
  channel, injects messages, and asserts against the sink.

**Use an exported, known-good channel as the fixture — do NOT hand-serialize channel XML and POST it.** This
is the one that costs *days*: `POST /api/channels` **accepts a structurally-incomplete channel without
normalizing or rejecting it**, deploys it "healthy", and it *partially works*. A channel serialized
programmatically outside the engine (via `ObjectXMLSerializer`, no plugins on the classpath) uses base/default
classes — transmission mode comes out as `FrameModeProperties` instead of the real
`MLLPModeProperties`, connectors have no `<pluginProperties/>`, `queueBufferSize` is `0`. With a **RAW**
datatype it works; with **HL7 v2.x** the destination sends the literal string **`undefined`** on the wire —
no error anywhere. The Administrator normalizes all of this on save. So: **build the channel once in the
Administrator, export it, strip the `<list>` wrapper and `<exportData>` block, and commit that XML as your
fixture.** (The REST API is fine once the config is complete — create *and* message-inject both work; and
you can freely edit *your own connector's* properties in the exported XML, e.g. the endpoint list.)

Two path traps that still bite even with a good fixture:
1. **`POST /channels/{id}/messages` binds `destinationMetaDataId` to an *empty set* when omitted → routes to
   ZERO destinations** (it dead-ends at the source; your connector never runs). Pass `?destinationMetaDataId=<id>`.
2. **Redeploying a stuck channel can leave it source-only.** Do a clean `_undeploy` → `_deploy` and wait for
   the **destination** child to report `STARTED`, not just the channel.

### Observability (operators will ask "where did it go?")

- **Log state transitions, not per message.** A per-message WARN floods under a sustained outage — log once
  when an endpoint/target goes DOWN and once when it RECOVERS.
- **OIE ships `rootLogger = ERROR`.** Your connector's INFO/WARN is invisible until an operator adds a
  `logger.<yourpkg>.name` / `.level` entry to `conf/log4j2.properties`. Document that in your README.
- **Stamp results where they show up.** Append to the response `statusMessage` and set a **connector-map**
  key (e.g. which endpoint received the message) so it appears in the Response and Connector Map views.

---
_Field notes from building an OIE connector plugin (2026); complements the pacmano1 guide in the sibling
references. See also `packaging-signing-serialization.md` for the Administrator Launcher signing wall._
