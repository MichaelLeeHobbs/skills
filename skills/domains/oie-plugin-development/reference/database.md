## Database support (Migrator + MyBatis)

If your plugin needs to store data in the OIE's internal database, you need a Migrator and MyBatis mappings.

### Migrator class

```java
package com.yourorg.yourplugin;

import com.mirth.connect.model.util.MigrationException;
import com.mirth.connect.server.migration.Migrator;
import java.util.List;

public class YourMigrator extends Migrator {
    @Override
    public void migrate() throws MigrationException {
        var sqlFile = switch (getDatabaseType()) {
            case "postgres"  -> "postgres-tables.sql";
            case "mysql"     -> "mysql-tables.sql";
            case "oracle"    -> "oracle-tables.sql";
            case "sqlserver" -> "sqlserver-tables.sql";
            case "derby"     -> "derby-tables.sql";
            default -> throw new MigrationException("Unsupported database: " + getDatabaseType());
        };
        executeScript("/" + sqlFile);
    }

    @Override
    public void migrateSerializedData() throws MigrationException {
        // No serialized plugin data to upgrade in this example.
    }

    @Override
    public List<String> getUninstallStatements() {
        return List.of("DROP TABLE your_table");
    }
}
```

Use the inherited `executeScript()` method so migration runs on the connection supplied by the engine and failures propagate as `MigrationException` with their causes. The leading `/` selects a classpath-root SQL resource instead of the engine's extension-directory prefix. Do not catch all failures as "already exists". Make creation repeatable in each supported dialect, or handle only an identified duplicate-object error after checking the existing schema. Keep later schema upgrades in a plugin-owned version record; the engine supplies its own starting version, not your plugin's version.

### Multi-database SQL scripts

Create one SQL file per database dialect in `server/src/main/resources/`:

```sql
CREATE TABLE IF NOT EXISTS your_table (
    id CHAR(36) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP
);
```

The SQL above is PostgreSQL-specific. Supply and test a script for every database you support, using that database version's syntax and repeat-run checks. Separate statements with a blank line for the engine's script reader. An existing table is not proof its columns match the required schema.

### MyBatis sqlmap.xml

Place in `package/resources/sqlmap.xml`, enable its assembly include, and register it in `plugin.xml`. Mirth Connect 4.5.2 and OIE use MyBatis 3 mapper XML, not iBATIS 2 SQL maps:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
    "https://mybatis.org/dtd/mybatis-3-mapper.dtd">

<mapper namespace="YourPlugin">
    <resultMap id="resultMap" type="com.yourorg.yourplugin.YourModel">
        <result property="id" column="id" />
        <result property="name" column="name" />
        <result property="createdAt" column="created_at" />
    </resultMap>

    <insert id="insert" parameterType="com.yourorg.yourplugin.YourModel">
        INSERT INTO your_table (id, name, created_at)
        VALUES (#{id}, #{name}, #{createdAt})
    </insert>

    <select id="getAll" resultMap="resultMap">
        SELECT * FROM your_table ORDER BY name
    </select>

    <select id="getById" parameterType="java.lang.String" resultMap="resultMap">
        SELECT * FROM your_table WHERE id = #{id}
    </select>

    <delete id="delete" parameterType="java.lang.String">
        DELETE FROM your_table WHERE id = #{id}
    </delete>
</mapper>
```

### Accessing MyBatis from your repository

Declare `org.mybatis:mybatis` as a `provided` dependency in the server module, using the version bundled by the target engine. Mirth Connect 4.5.2 bundles 3.1.1; check your OIE distribution rather than assuming the same version. The engine artifact's POM may not declare its bundled libraries transitively.

```xml
<dependency>
    <groupId>org.mybatis</groupId>
    <artifactId>mybatis</artifactId>
    <version>3.1.1</version>
    <scope>provided</scope>
</dependency>
```

```java
package com.yourorg.yourplugin;

import com.mirth.connect.server.util.SqlConfig;
import org.apache.ibatis.session.SqlSessionManager;
import java.util.List;

public class YourRepository {
    private final SqlSessionManager sqlSessionManager;

    public YourRepository() {
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

Construct the repository after engine initialization. Define the mapped `id`, `name`, and `createdAt` properties on `YourModel` in the shared module.

### Verify database integration

Compile both Java examples against your target engine, parse the mapper with its bundled MyBatis version, and exercise insert, select, and delete against each supported database. Run migration twice and verify the expected schema both times. Remove a required SQL resource or provoke a permission failure and confirm migration reports a failure with its cause. Do not report a database as verified if its checks could not run.

Check target-version contracts against [Migrator](https://github.com/nextgenhealthcare/connect/blob/4.5.2/server/src/com/mirth/connect/server/migration/Migrator.java), [DefaultMigrationController](https://github.com/nextgenhealthcare/connect/blob/4.5.2/server/src/com/mirth/connect/server/controllers/DefaultMigrationController.java), and [MyBatis mapper syntax](https://mybatis.org/mybatis-3/sqlmap-xml.html).

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
