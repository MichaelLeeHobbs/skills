## Plugin Descriptor (plugin.xml)

This is the most important file. It tells the OIE what your plugin provides. Lives in `package/resources/plugin.xml`.

```xml
<pluginMetaData path="your-plugin">
    <name>Your Plugin Name</name>
    <author>Your Name / Company</author>
    <pluginVersion>${project.version}</pluginVersion>
    <mirthVersion>4.5.2</mirthVersion>
    <url>https://github.com/yourorg/your-plugin</url>
    <description>Brief description of what the plugin does.</description>

    <!-- Server-side plugin classes (instantiated by the engine) -->
    <serverClasses>
        <string>com.yourorg.yourplugin.YourServerPlugin</string>
    </serverClasses>

    <!-- Client-side plugin classes (instantiated by the Administrator) -->
    <clientClasses>
        <string>com.yourorg.yourplugin.YourClientPlugin</string>
    </clientClasses>

    <!-- Optional: database migration class -->
    <migratorClass>com.yourorg.yourplugin.YourMigrator</migratorClass>

    <!-- Optional: MyBatis SQL map config -->
    <sqlMapConfigs>
        <entry>
            <string>all</string>
            <string>sqlmap.xml</string>
        </entry>
    </sqlMapConfigs>

    <!-- JAR libraries -->
    <library type="SERVER" path="your-plugin-server-${project.version}.jar" />
    <library type="SHARED" path="your-plugin-shared-${project.version}.jar" />
    <library type="CLIENT" path="your-plugin-client-${project.version}.jar" />

    <!-- If you bundle any third-party JARs, declare them too -->
    <!-- <library type="SERVER" path="some-dependency-1.0.jar" /> -->

    <!-- REST API registration -->
    <apiProvider type="SERVLET_INTERFACE"
                 name="com.yourorg.yourplugin.YourServletInterface" />
    <apiProvider type="SERVER_CLASS"
                 name="com.yourorg.yourplugin.YourServlet" />
</pluginMetaData>
```

### Key points

- **`path` attribute** on `<pluginMetaData>` becomes the URL path segment: `/extensions/your-plugin/...`
- **`${project.version}`** is substituted by Maven's resource filtering during the build.
- **Library `type`** values: `SERVER` (server classpath only), `CLIENT` (client classpath only), `SHARED` (both).
- If your plugin doesn't need a REST API, omit the `<apiProvider>` elements.
- If your plugin doesn't need a database, omit `<migratorClass>` and `<sqlMapConfigs>`.

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
