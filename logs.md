Running 'gradlew :app:bundleRelease' in /home/expo/workingdir/build/android
Downloading https://services.gradle.org/distributions/gradle-8.8-bin.zip
10%.
20%.
30%
40%.
50%.
60%.
70
%.
80%.
90%
100%
Welcome to Gradle 8.8!
Here are the highlights of this release:
 - Running Gradle on Java 22
- Configurable Gradle daemon JVM
- Improved IDE performance for large projects
For more details see https://docs.gradle.org/8.8/release-notes.html
To honour the JVM settings for this build a single-use Daemon process will be forked. For more on this, please refer to https://docs.gradle.org/8.8/userguide/gradle_daemon.html#sec:disabling_the_daemon in the Gradle documentation.
Daemon will be stopped at the end of the build
> Configure project :expo-gradle-plugin:expo-autolinking-plugin-shared
w: file:///home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-plugin-shared/build.gradle.kts:32:9: The expression is unused
> Task :gradle-plugin:settings-plugin:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :gradle-plugin:shared:checkKotlinGradlePluginConfigurationErrors SKIPPED
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:checkKotlinGradlePluginConfigurationErrors
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:checkKotlinGradlePluginConfigurationErrors
> Task :gradle-plugin:settings-plugin:pluginDescriptors
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:pluginDescriptors
> Task :gradle-plugin:settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:processResources
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:processResources NO-SOURCE
> Task :gradle-plugin:shared:compileKotlin
> Task :gradle-plugin:shared:compileJava NO-SOURCE
> Task :gradle-plugin:shared:classes UP-TO-DATE
> Task :gradle-plugin:shared:jar
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileKotlin
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:compileJava NO-SOURCE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:classes UP-TO-DATE
> Task :expo-gradle-plugin:expo-autolinking-plugin-shared:jar
> Task :gradle-plugin:settings-plugin:compileKotlin
> Task :gradle-plugin:settings-plugin:compileJava NO-SOURCE
> Task :gradle-plugin:settings-plugin:classes
> Task :gradle-plugin:settings-plugin:jar
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin
e: file:///home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt:24:28 Unresolved reference: extensions
e: file:///home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin/expo-autolinking-settings-plugin/src/main/kotlin/expo/modules/plugin/SettingsManager.kt:111:15 Unresolved reference: extra
> Task :expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin FAILED
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':expo-gradle-plugin:expo-autolinking-settings-plugin:compileKotlin'.
> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction
   > Compilation error. See log for more details
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
13 actionable tasks: 13 executed
BUILD FAILED in 1m 12s
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.
