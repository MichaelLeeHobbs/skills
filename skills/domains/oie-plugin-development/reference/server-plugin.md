## Server-Side Plugin

### ServicePlugin (general-purpose)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.plugins.ServicePlugin;
import java.util.Properties;

public class YourServerPlugin implements ServicePlugin {

    private static final String PLUGIN_NAME = "Your Plugin Name";

    @Override
    public String getPluginPointName() {
        return PLUGIN_NAME;
    }

    @Override
    public void init(Properties properties) {
        // Called once during server initialization.
        // Properties come from plugin settings (if any).
    }

    @Override
    public void start() {
        // Called when the plugin starts.
        // Initialize resources, register caches, start services.
    }

    @Override
    public void stop() {
        // Called when the plugin stops or the server shuts down.
        // Close connections, release resources.
    }

    @Override
    public void update(Properties properties) {
        // Called when plugin properties change at runtime.
    }

    @Override
    public Properties getDefaultProperties() {
        return new Properties();
    }

    @Override
    public ExtensionPermission[] getExtensionPermissions() {
        return new ExtensionPermission[0];
    }
}
```

### ChannelPlugin (react to channel events)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.model.Channel;
import com.mirth.connect.plugins.ChannelPlugin;
import com.mirth.connect.server.controllers.ControllerFactory;

public class YourChannelPlugin implements ChannelPlugin {

    @Override
    public String getPluginPointName() {
        return "Your Channel Plugin";
    }

    @Override
    public void save(Channel channel, ServerEventContext context) {
        // Called AFTER a channel is saved.
    }

    @Override
    public void remove(Channel channel, ServerEventContext context) {
        // Called AFTER a channel is deleted.
        // WARNING: The channel object may only have its ID populated.
        // Look up the full object if you need other fields.
    }

    @Override
    public void deploy() { }

    @Override
    public void undeploy() { }

    @Override
    public void start() { }

    @Override
    public void stop() { }
}
```

---


## REST API (Servlet Pattern)

### Servlet interface (in shared module)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.client.core.api.MirthOperation;
import com.mirth.connect.client.core.api.Param;

import javax.ws.rs.*;
import javax.ws.rs.core.MediaType;
import java.util.List;

@Path("/extensions/your-plugin")
@Consumes({ MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON })
@Produces({ MediaType.APPLICATION_XML, MediaType.APPLICATION_JSON })
public interface YourServletInterface {

    @GET
    @Path("/items")
    @MirthOperation(
        name = "getItems",
        display = "Get items",
        permission = Permissions.SERVER_SETTINGS_VIEW,
        auditable = false
    )
    List<YourModel> getItems() throws ClientException;

    @POST
    @Path("/items")
    @MirthOperation(
        name = "createItem",
        display = "Create item",
        permission = Permissions.SERVER_SETTINGS_EDIT,
        auditable = true
    )
    YourModel createItem(@Param("item") YourModel item) throws ClientException;
}
```

### Servlet implementation (in server module)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.server.api.MirthServlet;

import javax.servlet.http.HttpServletRequest;
import javax.ws.rs.core.Context;
import javax.ws.rs.core.SecurityContext;

public class YourServlet extends MirthServlet implements YourServletInterface {

    public YourServlet(
            @Context HttpServletRequest request,
            @Context SecurityContext sc) {
        super(request, sc, PLUGIN_NAME);
    }

    @Override
    public List<YourModel> getItems() throws ClientException {
        try {
            return repository.getAll();
        } catch (Exception e) {
            logger.error("Failed to get items", e);
            throw new MirthApiException(e);
        }
    }
}
```

---

## Permissions and Authorization

The OIE has a built-in permission system. Use `@MirthOperation` annotations to declare what permission is required for each endpoint.

Common permissions:
- `Permissions.SERVER_SETTINGS_VIEW` - Read settings data
- `Permissions.SERVER_SETTINGS_EDIT` - Modify settings data
- `Permissions.CHANNELS_VIEW` - View channel information
- `Permissions.CHANNELS_MANAGE` - Modify channels

For channel-specific authorization, use the `@CheckAuthorizedChannelId` annotation on servlet methods that accept a channel ID parameter.

Set `auditable = false` on read-only operations to avoid flooding the event log.

---

## Event Logging

For mutating operations (create, update, delete, refresh), log to the OIE event system:

```java
import com.mirth.connect.model.ServerEvent;
import com.mirth.connect.server.controllers.EventController;

private void logEvent(String action, String itemName, ServerEvent.Outcome outcome) {
    var attributes = new LinkedHashMap<String, String>();
    attributes.put("Plugin", PLUGIN_NAME);
    attributes.put("Item", itemName);
    attributes.put("Action", action);

    eventController.dispatchEvent(new ServerEvent(
        serverId,
        PLUGIN_NAME,
        ServerEvent.Level.INFORMATION,
        outcome,
        attributes
    ));
}
```

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
