## Client-Side Plugin

### SettingsPanelPlugin (adds a Settings tab)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.plugins.SettingsPanelPlugin;

public class YourSettingsPanelPlugin extends SettingsPanelPlugin {

    private YourSettingsPanel settingsPanel;

    public YourSettingsPanelPlugin(String name) {
        super(name);
    }

    @Override
    public AbstractSettingsPanel getSettingsPanel() {
        if (settingsPanel == null) {
            settingsPanel = new YourSettingsPanel("Your Plugin", this);
        }
        return settingsPanel;
    }

    @Override
    public void start() { }

    @Override
    public void stop() { }

    @Override
    public void reset() { }

    @Override
    public String getPluginPointName() {
        return "Your Plugin Settings";
    }
}
```

### ClientPlugin (adds task pane actions)

```java
package com.yourorg.yourplugin;

import com.mirth.connect.plugins.ClientPlugin;

public class YourClientPlugin extends ClientPlugin {

    public YourClientPlugin(String name) {
        super(name);
    }

    @Override
    public void start() {
        // Add a task to the channel list panel
        parent.addTask(
            "yourAction",                              // action name
            "Your Action Label",                       // display text
            "Description shown on hover.",             // tooltip
            "",                                        // keyboard shortcut
            new ImageIcon(                             // icon
                Frame.class.getResource("images/world.png")),
            parent.channelPanel.channelTasks,           // task pane
            parent.channelPanel                         // component
        );

        // Optionally add to channel editor tasks too:
        // parent.channelPanel.channelEditTasks
    }

    @Override
    public void stop() { }

    @Override
    public void reset() { }

    @Override
    public String getPluginPointName() {
        return "Your Client Plugin";
    }

    // This method is called when the user clicks the task
    public void yourAction() {
        // Open a dialog, execute an action, etc.
    }
}
```

---

## Shared Module

The shared module contains:

1. **DTOs / Models** - POJOs that travel between server and client via REST
2. **Servlet Interface** - The JAX-RS interface that defines your REST API contract
3. **Constants** - Shared strings, enums, etc.

### Model classes

```java
package com.yourorg.yourplugin;

import java.io.Serializable;

public class YourModel implements Serializable {
    private static final long serialVersionUID = 1L;

    private String id;
    private String name;
    // ... fields, getters, setters
}
```

If you use XStream for serialization (standard for OIE), add the alias annotation:

```java
import com.thoughtworks.xstream.annotations.XStreamAlias;

@XStreamAlias("yourModel")
public class YourModel implements Serializable { ... }
```

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
