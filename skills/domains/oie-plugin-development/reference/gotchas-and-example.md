## Gotchas and Lessons Learned

These are hard-won lessons from building multiple production OIE plugins.

### Building a connector? Read the connector reference first

Source/destination **connectors** are a different shape from service/servlet plugins and have their own
traps (subclass a stock connector, keep `getProtocol()` so TLS plugins are inherited, `ConnectorSettingsPanel`
styling, live testing). See **[`connector-plugins.md`](./connector-plugins.md)**. The highest-cost surprises:
- **Unsigned jars deploy but won't open in the Administrator Launcher** ("has no code signers") — sign
  self-signed and launch with `-k`. See [`packaging-signing-serialization.md`](./packaging-signing-serialization.md).
- **`MirthRadioButton`/`MirthCheckBox` are gray on a white panel** — `setBackground(Color.WHITE)` on each;
  set the table's scroll **viewport** white too.
- **`POST /channels/{id}/messages` with no `destinationMetaDataId` routes to *zero* destinations** — the
  message dead-ends at the source and your connector never runs.
- **Don't hand-serialize channel XML for tests.** `POST /api/channels` accepts a structurally-incomplete
  channel and it *partially* works (RAW passthrough is fine; HL7 v2.x sends the literal `undefined` on the
  wire). Build the channel in the Administrator, **export** it, and use that as the fixture.

### Dependencies and Classpath

1. **Mark all OIE-provided dependencies as `provided` scope.** The engine bundles its own versions of Guava, Jackson, Log4j, SLF4j, commons-lang, XStream, MigLayout, SwingX, HikariCP, and many others. If you bundle your own copy, you get classpath conflicts that manifest as bizarre `NoSuchMethodError` or `ClassCastException` at runtime.

2. **Use assembly.xml `<include>` filters.** Without explicit includes, Maven's dependency plugin will copy every transitive dependency into your staging directory, and the assembly plugin will bundle them all. Your ZIP will contain dozens of JARs the engine already has. The include filter (`your-plugin-*.jar`) ensures only your JARs make it into the ZIP.

3. **If you must bundle a third-party JAR**, declare it as a `<library>` in plugin.xml and add it to your assembly includes. Test carefully for conflicts with engine-provided versions.

4. **OGNL / javassist conflict**: If you depend on OGNL, exclude javassist from it (Mirth bundles a higher version). The simple-channel-history plugin works around this by unpacking OGNL classes directly into its client JAR.

### Serialization

5. **Call `ObjectXMLSerializer.getInstance().allowTypes()` in both server and client `start()` methods.** If you only do it on one side, the other side will throw `ForbiddenClassException` when deserializing your model classes. This is the single most common "it works on the server but crashes the Administrator" bug.

6. **Use `serialVersionUID` on all model classes.** Without it, any recompilation can change the generated serial version UID, breaking deserialization of objects serialized by a previous build.

### Server-Side

7. **`ChannelPlugin.remove()` and `CodeTemplateServerPlugin.remove()` may receive partial objects.** The channel/template passed to `remove()` may only have its ID populated. If you need the full object (name, content, etc.), look it up via the appropriate controller before using it.

8. **Don't do heavy work in constructors.** Use `start()` for initialization. The engine instantiates plugin classes early, and constructor failures can prevent the server from starting.

9. **Fail silently for non-critical operations.** If your plugin intercepts channel saves (like saving history), log errors but don't throw. A bug in your plugin should never prevent a user from saving a channel.

10. **Use SLF4j / Log4j for logging, never `System.out.println`.** The engine has a logging framework. Use it.

11. **Be careful with singletons.** If you use a singleton pattern (common for repositories and managers), make sure `stop()` nulls out the instance and releases resources. The engine can restart plugins without restarting the JVM.

### Client-Side (Swing)

12. **Use `SwingWorker` for all REST calls from the client.** The Administrator is a Swing application. Blocking the EDT (Event Dispatch Thread) with a REST call will freeze the UI. Always do API calls in a SwingWorker background thread and update the UI in `done()`.

13. **Extend `JDialog`, not `MirthDialog`.** Despite the name, MirthDialog has quirks. Plain JDialog works better and gives you more control.

14. **Bind the Escape key to close dialogs.** Users expect this. Register an action on `JComponent.WHEN_IN_FOCUSED_WINDOW` for `KeyEvent.VK_ESCAPE`.

15. **For large result sets, do a count query first.** The oie-source-code-search plugin does a count before fetching full results. If the count exceeds a threshold (e.g., 5000), show a confirmation dialog. This prevents the UI from locking up on huge result sets.

### Database

16. **Write separate SQL scripts for each database dialect.** PostgreSQL, MySQL, Oracle, SQL Server, and Derby all have syntax differences. Oracle is the worst offender: no `IF NOT EXISTS`, no `ADD COLUMN` (just `ADD`), uses `NUMBER` instead of `INTEGER`, and `CLOB` instead of `TEXT`.

17. **Handle "already exists" errors gracefully in your Migrator.** The `migrate()` method runs every time the plugin starts. Your CREATE TABLE statements will fail on the second startup if you don't use `IF NOT EXISTS` (or catch the error for Oracle/Derby).

18. **MyBatis uses iBATIS 2 syntax**, not the modern MyBatis 3 mapper syntax. Use `#property#` for parameter binding (not `#{property}`), and `parameterClass` / `resultMap` attributes.

### REST API

19. **The REST path is derived from plugin.xml's `path` attribute.** Your servlet endpoints are mounted at `/api/extensions/<path>/...`. Make sure the path in plugin.xml matches what your servlet interface declares.

20. **Set `auditable = false` on read-only `@MirthOperation` annotations.** Otherwise every GET request generates an audit log entry, which creates noise and can slow down the server.

### Packaging and Distribution

21. **The plugin ZIP structure matters.** Inside the ZIP there must be a single directory named after your plugin's `path`, containing all JARs, plugin.xml, and any other resources. The structure is:
    ```
    your-plugin.zip
    └── your-plugin/
        ├── your-plugin-server-1.0.0.jar
        ├── your-plugin-shared-1.0.0.jar
        ├── your-plugin-client-1.0.0.jar
        ├── plugin.xml
        └── sqlmap.xml (if applicable)
    ```

22. **Resource filtering must be enabled for plugin.xml.** The `${project.version}` placeholders in plugin.xml need Maven to substitute them during the build. The `maven-resources-plugin` with `<filtering>true</filtering>` handles this.

23. **After installing a plugin, restart the OIE server.** Plugins are loaded at startup. There is no hot-reload.

### Testing

24. **JUnit 5 + Mockito is the standard for newer plugins.** The engine itself uses JUnit 4, but there's no reason your plugin can't use JUnit 5.

25. **Mock the OIE controllers in tests.** You can't easily spin up a Mirth server in a test. Mock `ControllerFactory`, `SqlConfig`, and other engine singletons to test your logic in isolation.

26. **Test your permission annotations.** Write a test that reflects over your servlet interface and verifies each method has the correct `@MirthOperation` with the expected permission. This catches permission misconfigurations early.

### General

27. **Use `var` freely.** Java 17 is the target. Switch expressions, text blocks, and `var` are all fine.

28. **No Lombok.** It adds a build-time dependency and can cause issues with the engine's classloader.

29. **Add SPDX license headers to all source files.** It's good practice and some organizations require it.

30. **Encrypt sensitive data at rest.** If your plugin stores passwords or secrets, use `ConfigurationController.getEncryptor()` with the `{enc}` prefix convention. Check for the prefix before encrypting to avoid double-encryption.

---

## Minimal Working Example

Here's the absolute minimum to get a plugin that adds a "Hello" button to the Settings page:

**shared/YourServletInterface.java** - One GET endpoint returning a string.

**server/YourServerPlugin.java** - `ServicePlugin` with empty lifecycle methods.

**server/YourServlet.java** - `MirthServlet` implementing your interface.

**client/YourSettingsPanelPlugin.java** - `SettingsPanelPlugin` with a panel that calls the endpoint.

**package/resources/plugin.xml** - Declares classes, JARs, and API provider.

Build, install the ZIP, restart the server, and your tab appears in Settings.

From there, add complexity incrementally: database storage, more endpoints, richer UI.

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
