## Database Support (Migrator + MyBatis)

If your plugin needs to store data in the OIE's internal database, you need a Migrator and MyBatis mappings.

### Migrator class

```java
package com.yourorg.yourplugin;

import com.mirth.connect.server.migration.Migrator;
import com.mirth.connect.server.util.DatabaseUtil;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;
import java.util.List;

public class YourMigrator extends Migrator {
    private static final Logger logger = LogManager.getLogger(YourMigrator.class);

    @Override
    public void migrate() throws MigratableException {
        try {
            var dbType = getDatabaseType();
            var sqlFile = switch (dbType) {
                case "postgres"   -> "postgres-tables.sql";
                case "mysql"      -> "mysql-tables.sql";
                case "oracle"     -> "oracle-tables.sql";
                case "sqlserver"  -> "sqlserver-tables.sql";
                default           -> "derby-tables.sql";
            };

            var sql = new String(getClass().getResourceAsStream("/" + sqlFile).readAllBytes());
            DatabaseUtil.executeScript(sql, false);
        } catch (Exception e) {
            // "already exists" errors are expected on subsequent startups
            logger.debug("Migration note (may be expected): {}", e.getMessage());
        }
    }

    @Override
    public List<String> getUninstallStatements() {
        return List.of("DROP TABLE IF EXISTS your_table");
    }
}
```

### Multi-database SQL scripts

Create one SQL file per database dialect in `server/src/main/resources/`:

```sql
-- postgres-tables.sql
CREATE TABLE IF NOT EXISTS your_table (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP
);
```

Oracle is the most annoying: no `IF NOT EXISTS`, uses `NUMBER` instead of `INTEGER`, `CLOB` instead of `TEXT`, and `ADD` instead of `ADD COLUMN` for ALTER TABLE.

### MyBatis sqlmap.xml

Place in `package/resources/sqlmap.xml`:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE sqlMap PUBLIC "-//ibatis.apache.org//DTD SQL Map 2.0//EN"
    "http://ibatis.apache.org/dtd/sql-map-2.dtd">

<sqlMap namespace="YourPlugin">
    <resultMap id="resultMap" class="com.yourorg.yourplugin.YourModel">
        <result property="id" column="id" />
        <result property="name" column="name" />
        <result property="createdAt" column="created_at" />
    </resultMap>

    <insert id="insert" parameterClass="com.yourorg.yourplugin.YourModel">
        INSERT INTO your_table (id, name, created_at)
        VALUES (#id#, #name#, #createdAt#)
    </insert>

    <select id="getAll" resultMap="resultMap">
        SELECT * FROM your_table ORDER BY name
    </select>

    <select id="getById" parameterClass="java.lang.String" resultMap="resultMap">
        SELECT * FROM your_table WHERE id = #id#
    </select>

    <delete id="delete" parameterClass="java.lang.String">
        DELETE FROM your_table WHERE id = #id#
    </delete>
</sqlMap>
```

### Accessing MyBatis from your repository

```java
import com.mirth.connect.server.util.SqlConfig;

public class YourRepository {
    private final SqlSessionManager sqlSessionManager;

    public void init() {
        this.sqlSessionManager = SqlConfig.getInstance().getSqlSessionManager();
    }

    public List<YourModel> getAll() {
        return sqlSessionManager.selectList("YourPlugin.getAll");
    }

    public void create(YourModel model) {
        sqlSessionManager.insert("YourPlugin.insert", model);
    }
}
```

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
