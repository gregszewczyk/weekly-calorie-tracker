Running 'gradlew :app:bundleRelease' in /home/expo/workingdir/build/android
Downloading https://services.gradle.org/distributions/gradle-8.6-bin.zip
10%
20%.
30%.
40%.
50%.
60%
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
FAILURE:
Build failed with an exception.
* Where:
Settings file '/home/expo/workingdir/build/android/settings.gradle' line: 21
* What went wrong:
Error resolving plugin [id: 'com.facebook.react.settings']
> Included build '/home/expo/workingdir/build/node_modules/expo-modules-autolinking/android/expo-gradle-plugin' does not exist.
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED
in 22s
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.