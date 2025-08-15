Running 'gradlew :app:assembleRelease' in /home/expo/workingdir/build/android
Downloading https://services.gradle.org/distributions/gradle-8.6-bin.zip
10%
20%.
30%.
40%.
50%.
60%.
70%
80%.
90%.
100%
Welcome to Gradle 8.6!
Here are the highlights of this release:
 - Configurable encryption key for configuration cache
- Build init improvements
 - Build authoring improvements
For more details see https://docs.gradle.org/8.6/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.6/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build
Path for java installation '/usr/lib/jvm/openjdk-17' (Common Linux Locations) does not contain a java executable
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
FAILURE: Build failed with an exception.
* What went wrong:
A problem occurred configuring root project 'WeeklyCalorieTracker'.
> Could not resolve all files for configuration ':classpath'.
   > Could not find com.facebook.react:react-native-gradle-plugin:0.76.9.
     Searched in the following locations:
       - http://maven.production.caches.eas-build.internal/artifactory/libs-release/com/facebook/react/react-native-gradle-plugin/0.76.9/react-native-gradle-plugin-0.76.9.pom
       - https://dl.google.com/dl/android/maven2/com/facebook/react/react-native-gradle-plugin/0.76.9/react-native-gradle-plugin-0.76.9.pom
       - https://repo.maven.apache.org/maven2/com/facebook/react/react-native-gradle-plugin/0.76.9/react-native-gradle-plugin-0.76.9.pom
     Required by:
         project :
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED in 46s
8 actionable tasks: 8 executed
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.