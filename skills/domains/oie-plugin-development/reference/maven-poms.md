## The Root POM

The root POM is a parent that defines shared properties, dependency versions, and module order.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<project xmlns="http://maven.apache.org/POM/4.0.0"
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0
         http://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>

    <groupId>com.yourorg</groupId>
    <artifactId>your-plugin</artifactId>
    <version>${revision}</version>
    <packaging>pom</packaging>

    <name>Your Plugin Name</name>

    <modules>
        <module>shared</module>
        <module>server</module>
        <module>client</module>
        <module>package</module>
    </modules>

    <properties>
        <revision>1.0.0</revision>
        <mc.version>4.5.2</mc.version>
        <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
    </properties>

    <repositories>
        <repository>
            <id>mirth-libs</id>
            <url>https://repo.repsy.io/mvn/kpalang/mirthconnect</url>
        </repository>
    </repositories>

    <dependencyManagement>
        <dependencies>
            <!-- OIE Server -->
            <dependency>
                <groupId>com.mirth.connect</groupId>
                <artifactId>mirth-server</artifactId>
                <version>${mc.version}</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>com.mirth.connect</groupId>
                <artifactId>donkey-server</artifactId>
                <version>${mc.version}</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>com.mirth.connect</groupId>
                <artifactId>mirth-client-core</artifactId>
                <version>${mc.version}</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>com.mirth.connect</groupId>
                <artifactId>mirth-client</artifactId>
                <version>${mc.version}</version>
                <scope>provided</scope>
            </dependency>

            <!-- Servlet / JAX-RS -->
            <dependency>
                <groupId>javax.servlet</groupId>
                <artifactId>javax.servlet-api</artifactId>
                <version>4.0.1</version>
                <scope>provided</scope>
            </dependency>
            <dependency>
                <groupId>javax.ws.rs</groupId>
                <artifactId>javax.ws.rs-api</artifactId>
                <version>2.0.1</version>
                <scope>provided</scope>
            </dependency>

            <!-- Logging -->
            <dependency>
                <groupId>org.slf4j</groupId>
                <artifactId>slf4j-api</artifactId>
                <version>1.7.32</version>
                <scope>provided</scope>
            </dependency>

            <!-- Serialization -->
            <dependency>
                <groupId>com.thoughtworks.xstream</groupId>
                <artifactId>xstream</artifactId>
                <version>1.4.18</version>
                <scope>provided</scope>
            </dependency>
        </dependencies>
    </dependencyManagement>

    <build>
        <pluginManagement>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-compiler-plugin</artifactId>
                    <version>3.11.0</version>
                    <configuration>
                        <release>17</release>
                    </configuration>
                </plugin>
            </plugins>
        </pluginManagement>
    </build>
</project>
```

### Key points

- **`${revision}` property**: Use Maven's flat versioning. Set the version once, all modules inherit it.
- **`provided` scope on everything from the engine**: The OIE server already has these JARs. If you bundle them, you get classpath conflicts.
- **Module order matters**: shared first, then server and client (which depend on shared), then package last.

---

## Module POMs

### shared/pom.xml

```xml
<project>
    <parent>
        <groupId>com.yourorg</groupId>
        <artifactId>your-plugin</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>your-plugin-shared</artifactId>

    <dependencies>
        <dependency>
            <groupId>javax.ws.rs</groupId>
            <artifactId>javax.ws.rs-api</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mirth.connect</groupId>
            <artifactId>mirth-client-core</artifactId>
        </dependency>
        <dependency>
            <groupId>com.thoughtworks.xstream</groupId>
            <artifactId>xstream</artifactId>
        </dependency>
        <!-- Swagger annotations for REST docs (optional) -->
        <dependency>
            <groupId>io.swagger.core.v3</groupId>
            <artifactId>swagger-annotations</artifactId>
            <version>2.1.9</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

### server/pom.xml

```xml
<project>
    <parent>
        <groupId>com.yourorg</groupId>
        <artifactId>your-plugin</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>your-plugin-server</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.yourorg</groupId>
            <artifactId>your-plugin-shared</artifactId>
            <version>${revision}</version>
        </dependency>
        <dependency>
            <groupId>com.mirth.connect</groupId>
            <artifactId>mirth-server</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mirth.connect</groupId>
            <artifactId>donkey-server</artifactId>
        </dependency>
        <dependency>
            <groupId>javax.servlet</groupId>
            <artifactId>javax.servlet-api</artifactId>
        </dependency>
        <dependency>
            <groupId>org.slf4j</groupId>
            <artifactId>slf4j-api</artifactId>
        </dependency>
    </dependencies>
</project>
```

### client/pom.xml

```xml
<project>
    <parent>
        <groupId>com.yourorg</groupId>
        <artifactId>your-plugin</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>your-plugin-client</artifactId>

    <dependencies>
        <dependency>
            <groupId>com.yourorg</groupId>
            <artifactId>your-plugin-shared</artifactId>
            <version>${revision}</version>
        </dependency>
        <dependency>
            <groupId>com.mirth.connect</groupId>
            <artifactId>mirth-client</artifactId>
        </dependency>
        <dependency>
            <groupId>com.mirth.connect</groupId>
            <artifactId>mirth-client-core</artifactId>
        </dependency>
        <!-- UI libraries (all provided by the Administrator) -->
        <dependency>
            <groupId>com.miglayout</groupId>
            <artifactId>miglayout</artifactId>
            <version>3.7.4</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>org.swinglabs</groupId>
            <artifactId>swingx-core</artifactId>
            <version>1.6.2-2</version>
            <scope>provided</scope>
        </dependency>
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.14.3</version>
            <scope>provided</scope>
        </dependency>
    </dependencies>
</project>
```

---


## Build Commands

```bash
# Standard build (produces package/target/your-plugin-1.0.0.zip)
mvn clean package

# Build without tests
mvn clean package -DskipTests

# Build with code signing
mvn clean package -Psigning -Dsigning.storepass=YOUR_PIN

# Run tests only
mvn test
```

The installable ZIP ends up at `package/target/your-plugin-<version>.zip`. Upload this through the OIE Administrator's Extension Manager.

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
