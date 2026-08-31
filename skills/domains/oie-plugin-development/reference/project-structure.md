## Prerequisites

- **Java 17+** (the OIE server runs on Java 17)
- **Maven 3.8+**
- **OIE / Mirth Connect 4.5.2+** (for testing)
- Access to the Mirth Connect Maven repository for compile-time dependencies

### Maven Repository

Add this to your root POM to resolve Mirth dependencies:

```xml
<repositories>
    <repository>
        <id>mirth-libs</id>
        <url>https://repo.repsy.io/mvn/kpalang/mirthconnect</url>
    </repository>
</repositories>
```

---

## Project Structure

Every OIE plugin follows a four-module Maven layout:

```
your-plugin/
├── pom.xml              # Root parent POM
├── shared/              # Models, DTOs, servlet interface
│   ├── pom.xml
│   └── src/main/java/
├── server/              # Server-side logic, REST servlet, services
│   ├── pom.xml
│   └── src/main/java/
├── client/              # Swing UI (runs in the Mirth Administrator)
│   ├── pom.xml
│   └── src/main/java/
├── package/             # Assembly module — builds the installable ZIP
│   ├── pom.xml
│   ├── assembly.xml
│   └── resources/
│       └── plugin.xml   # OIE plugin descriptor
├── LICENSE
├── README.md
└── .gitignore
```

**Why four modules?**

- **shared** is on both the server and client classpath. Put your DTOs, servlet interface, and constants here.
- **server** runs inside the OIE server JVM. It has access to controllers, the database, and the full engine API.
- **client** runs inside the Mirth Administrator (a Swing application launched via Java Web Start or the bundled launcher). It can only talk to the server through the REST API.
- **package** doesn't contain code. It copies JARs, signs them (optionally), and builds the final ZIP.

---

## Scaffolding a New Plugin

### 1. Create the directory structure

```bash
mkdir -p your-plugin/{shared,server,client,package/resources}/src/main/java/com/yourorg/yourplugin
mkdir -p your-plugin/{shared,server,client}/src/test/java/com/yourorg/yourplugin
mkdir -p your-plugin/package/resources
```

### 2. Choose your plugin type

The OIE supports several plugin interfaces. Pick the one that matches your use case:

| Interface | When to Use |
|-----------|-------------|
| `ServicePlugin` | General-purpose server plugin with lifecycle (start/stop). Good for plugins that need background services or manage their own state. |
| `ChannelPlugin` | Hooks into channel save/deploy/undeploy/remove events. Use when you need to react to channel lifecycle changes. |
| `CodeTemplateServerPlugin` | Hooks into code template save/remove events. |
| `SettingsPanelPlugin` (client) | Adds a tab to the Settings section of the Administrator. |
| `ClientPlugin` (client) | Adds actions to the channel list or channel editor task panes. |

You can combine multiple interfaces in one plugin. For example, simple-channel-history uses both `ChannelPlugin` and `CodeTemplateServerPlugin` on the server side, and `ClientPlugin` plus `SettingsPanelPlugin` on the client side.

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
