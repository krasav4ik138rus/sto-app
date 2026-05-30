# Local Development

## Android Builds On Windows

Android builds for this Expo/React Native project must run with JDK 17.

Check the active Java before running Gradle or `expo run:android`:

```powershell
java -version
javac -version
echo $env:JAVA_HOME
cd mobile\android
.\gradlew.bat -version
cd ..\..
```

Expected major version:

```text
17
```

Do not use JDK 25 for Android builds. If Gradle runs with JDK 25, builds can fail with:

```text
Unsupported class file major version 69
```

Major version `69` is Java 25 bytecode. Keep JDK 17 active for Gradle, Expo prebuild, and `expo run:android`.

### Set JAVA_HOME To JDK 17

Find an installed JDK 17:

```powershell
Get-ChildItem "C:\Program Files\Eclipse Adoptium" -Directory -Filter "jdk-17*" -ErrorAction SilentlyContinue
Get-ChildItem "C:\Program Files\Java" -Directory -Filter "jdk-17*" -ErrorAction SilentlyContinue
Get-ChildItem "$env:LOCALAPPDATA\Programs" -Directory -Recurse -Filter "jdk-17*" -ErrorAction SilentlyContinue
```

For the current PowerShell session, replace the path with the JDK 17 directory found on your machine:

```powershell
$env:JAVA_HOME = "C:\Program Files\Eclipse Adoptium\jdk-17.x.x"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
```

To persist it for future PowerShell sessions:

```powershell
[Environment]::SetEnvironmentVariable("JAVA_HOME", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x", "User")
[Environment]::SetEnvironmentVariable("Path", "C:\Program Files\Eclipse Adoptium\jdk-17.x.x\bin;" + [Environment]::GetEnvironmentVariable("Path", "User"), "User")
```

Open a new terminal after changing user environment variables.

If Android Studio has a bundled JDK and `java -version` reports version 17, that path is also acceptable. Common Android Studio JDK locations include:

```text
C:\Program Files\Android\Android Studio\jbr
```

### Gradle Java Home

Do not commit a machine-specific `org.gradle.java.home=...` path to `mobile/android/gradle.properties`. The `mobile/android` folder is generated locally by Expo and paths differ between machines.

Use `JAVA_HOME` and `Path` instead. If you need a one-machine-only override for a generated native project, add it locally in `mobile/android/gradle.properties` after prebuild:

```properties
org.gradle.java.home=C:\\Program Files\\Eclipse Adoptium\\jdk-17.x.x
```

Keep that change local.

### Gradle Wrapper

React Native 0.83 uses Android Gradle Plugin 8.12.x. Keep the generated Android wrapper on a stable Gradle 8.x release, for example:

```properties
distributionUrl=https\://services.gradle.org/distributions/gradle-8.14.3-bin.zip
```

Gradle 9 can fail in this stack through the Java toolchain resolver path before the app build starts.

### Clean Android Build Check

```powershell
cd C:\Users\alex\sto-app\mobile\android
.\gradlew.bat --stop
Remove-Item -Recurse -Force .\.gradle -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .\app\build -ErrorAction SilentlyContinue
cd ..
bunx expo run:android
```
