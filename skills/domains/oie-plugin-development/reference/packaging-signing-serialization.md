## Packaging and Assembly

### package/pom.xml

```xml
<project>
    <parent>
        <groupId>com.yourorg</groupId>
        <artifactId>your-plugin</artifactId>
        <version>${revision}</version>
    </parent>

    <artifactId>your-plugin-package</artifactId>
    <packaging>pom</packaging>

    <dependencies>
        <dependency>
            <groupId>com.yourorg</groupId>
            <artifactId>your-plugin-server</artifactId>
            <version>${revision}</version>
        </dependency>
        <dependency>
            <groupId>com.yourorg</groupId>
            <artifactId>your-plugin-shared</artifactId>
            <version>${revision}</version>
        </dependency>
        <dependency>
            <groupId>com.yourorg</groupId>
            <artifactId>your-plugin-client</artifactId>
            <version>${revision}</version>
        </dependency>
    </dependencies>

    <build>
        <plugins>
            <!-- Copy plugin.xml with version substitution -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-resources-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-plugin-xml</id>
                        <phase>process-resources</phase>
                        <goals><goal>copy-resources</goal></goals>
                        <configuration>
                            <outputDirectory>
                                ${project.build.directory}/to-be-packed
                            </outputDirectory>
                            <resources>
                                <resource>
                                    <directory>resources</directory>
                                    <filtering>true</filtering>
                                </resource>
                            </resources>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

            <!-- Copy module JARs to staging directory -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-dependency-plugin</artifactId>
                <executions>
                    <execution>
                        <id>copy-jars</id>
                        <phase>prepare-package</phase>
                        <goals><goal>copy</goal></goals>
                        <configuration>
                            <artifactItems>
                                <artifactItem>
                                    <groupId>com.yourorg</groupId>
                                    <artifactId>your-plugin-server</artifactId>
                                    <outputDirectory>
                                        ${project.build.directory}/to-be-packed
                                    </outputDirectory>
                                </artifactItem>
                                <artifactItem>
                                    <groupId>com.yourorg</groupId>
                                    <artifactId>your-plugin-shared</artifactId>
                                    <outputDirectory>
                                        ${project.build.directory}/to-be-packed
                                    </outputDirectory>
                                </artifactItem>
                                <artifactItem>
                                    <groupId>com.yourorg</groupId>
                                    <artifactId>your-plugin-client</artifactId>
                                    <outputDirectory>
                                        ${project.build.directory}/to-be-packed
                                    </outputDirectory>
                                </artifactItem>
                            </artifactItems>
                        </configuration>
                    </execution>
                </executions>
            </plugin>

            <!-- Build the final ZIP -->
            <plugin>
                <groupId>org.apache.maven.plugins</groupId>
                <artifactId>maven-assembly-plugin</artifactId>
                <executions>
                    <execution>
                        <id>build-zip</id>
                        <phase>package</phase>
                        <goals><goal>single</goal></goals>
                        <configuration>
                            <appendAssemblyId>false</appendAssemblyId>
                            <descriptors>
                                <descriptor>assembly.xml</descriptor>
                            </descriptors>
                        </configuration>
                    </execution>
                </executions>
            </plugin>
        </plugins>
    </build>
</project>
```

### package/assembly.xml

```xml
<assembly xmlns="http://maven.apache.org/plugins/maven-assembly-plugin/assembly/1.1.2">
    <id>plugin</id>
    <formats>
        <format>zip</format>
    </formats>
    <includeBaseDirectory>false</includeBaseDirectory>
    <fileSets>
        <fileSet>
            <directory>${project.build.directory}/to-be-packed</directory>
            <outputDirectory>your-plugin</outputDirectory>
            <includes>
                <!-- Only include YOUR plugin JARs and descriptor files -->
                <include>your-plugin-*.jar</include>
                <include>plugin.xml</include>
                <!-- Include sqlmap.xml if you use MyBatis -->
                <!-- <include>sqlmap.xml</include> -->
                <!-- Include any third-party JARs you need to bundle -->
                <!-- <include>some-dependency-*.jar</include> -->
            </includes>
        </fileSet>
    </fileSets>
</assembly>
```

**Important**: The `<include>` filter in assembly.xml prevents transitive dependencies from leaking into the ZIP. Without it, Maven will copy every transitive dependency into the staging directory and they'll all end up in your ZIP, causing classpath conflicts.

---


## XStream Serialization

If your models travel between server and client via the REST API, you must register them with XStream's type allowlist. Without this, the client will throw `ForbiddenClassException` when deserializing responses.

```java
import com.mirth.connect.model.converters.ObjectXMLSerializer;

// Call this in BOTH your server plugin start() AND client plugin start()
public static void registerSerializableTypes() {
    ObjectXMLSerializer.getInstance().allowTypes(
        YourModel.class,
        YourOtherModel.class
    );
}
```

This is one of the most common "why does my plugin work on the server but crash the client?" issues.

---

## Code Signing

### Why you actually need this: the Administrator Launcher

The **server loads unsigned jars fine** — but the **Administrator Launcher verifies jar signatures** and
refuses an unsigned extension:

```
Error verifying entry "META-INF/MANIFEST.MF" in JAR file your-plugin-shared-1.0.0.jar
… has no code signers.
```

So a connector/GUI plugin that isn't signed builds and deploys, then fails to open in the Administrator.
Stock OIE signs its own jars with a **self-signed** cert, so self-signed is enough — you just have to tell
the Launcher to accept it.

### Self-signed dev signing (fast path)

1. Generate a self-signed keystore — Mirth uses the legacy Java **JKS** keystore format:
   ```bash
   keytool -genkeypair -keyalg RSA -keysize 2048 -alias selfsigned \
     -keystore certificate/keystore.jks -storepass storepass -keypass storepass \
     -validity 3650 -storetype JKS -dname "CN=Your Plugin (dev self-signed), O=you, C=US"
   ```
2. Build with the `signing` profile pointed at it (see the POM below):
   `mvn clean package -Psigning -Dsigning.keystore=certificate/keystore.jks -Dsigning.alias=selfsigned -Dsigning.storepass=storepass`
3. Launch the Administrator **Launcher** with `-k` (`--allow-self-signed`) — on Windows, append ` -k` to the
   shortcut's *Target* field; on macOS/Linux, `java -jar mirth-client-launcher.jar -k`. (`-d`,
   `--allow-incorrect-digest`, is the sibling flag for digest mismatches.)

Two config gotchas for the self-signed path:
- **Do not set a `<tsa>`** (timestamp authority) on a self-signed dev cert. It makes the *client* do slow,
  often-failing OCSP/timestamp lookups. Add a `<tsa>` back only for a real CA-signed release build.
- Add `<keypass>${signing.storepass}</keypass>` if your key and store share a password.
- **Don't commit the keystore.** Even a throwaway self-signed keystore holds a private key — committing it is
  a credential/supply-chain smell and tends to get copied forward. Generate it locally (or in CI) and
  `.gitignore` it; document the one `keytool` command (above) so anyone can regenerate. If you must commit
  something for reproducibility, commit only the **public certificate**, not the keystore.

### The signing POM

Sign the **collected** jars in the package staging dir, right before the assembly zips them (bind to
`prepare-package`, after `copy-jars`). Add a `signing` profile:

```xml
<profiles>
    <profile>
        <id>signing</id>
        <build>
            <plugins>
                <plugin>
                    <groupId>org.apache.maven.plugins</groupId>
                    <artifactId>maven-jarsigner-plugin</artifactId>
                    <version>3.0.0</version>
                    <executions>
                        <execution>
                            <id>sign-jars</id>
                            <phase>prepare-package</phase>
                            <goals><goal>sign</goal></goals>
                            <configuration>
                                <archiveDirectory>
                                    ${project.build.directory}/to-be-packed
                                </archiveDirectory>
                                <includes>
                                    <include>your-plugin-*.jar</include>
                                </includes>
                                <!-- Configure for your signing method -->
                                <keystore>NONE</keystore>
                                <storetype>PKCS11</storetype>
                                <providerClass>sun.security.pkcs11.SunPKCS11</providerClass>
                                <providerArg>yubikey-pkcs11.cfg</providerArg>
                                <storepass>${signing.storepass}</storepass>
                                <alias>Certificate for PIV Authentication</alias>
                                <certchain>certchain.pem</certchain>
                                <tsa>http://timestamp.digicert.com</tsa>
                            </configuration>
                        </execution>
                    </executions>
                </plugin>
            </plugins>
        </build>
    </profile>
</profiles>
```

Build with signing: `mvn clean package -Psigning -Dsigning.storepass=YOUR_PIN`

---

---
_Source: adapted from the OIE Plugin Development Guide by [@pacmano1](https://github.com/pacmano1)._
