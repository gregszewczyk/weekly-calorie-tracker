Running 'gradlew :app:bundleRelease' in /home/expo/workingdir/build/android
Downloading https://services.gradle.org/distributions/gradle-8.6-bin.zip
10%.
20%.
30%.
40%.
50%.
60%.
70%.
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
> Task :app:preBuild UP-TO-DATE
> Task :app:preReleaseBuild UP-TO-DATE
> Task :app:generateReleaseResValues
> Task :app:mapReleaseSourceSetPaths
> Task :app:generateReleaseResources
> Task :app:createReleaseCompatibleScreenManifests
> Task :app:extractDeepLinksRelease
> Task :app:processReleaseMainManifest
> Task :app:mergeReleaseResources
> Task :app:processReleaseManifest
> Task :app:processApplicationManifestReleaseForBundle
> Task :app:checkReleaseAarMetadata
> Task :app:packageReleaseResources
> Task :app:parseReleaseLocalResources
> Task :app:extractReleaseVersionControlInfo
> Task :app:checkReleaseDuplicateClasses
> Task :app:buildKotlinToolingMetadata
> Task :app:checkKotlinGradlePluginConfigurationErrors
> Task :app:generateReleaseBuildConfig
> Task :app:desugarReleaseFileDependencies
> Task :app:javaPreCompileRelease
> Task :app:mergeReleaseStartupProfile
> Task :app:mergeReleaseShaders
> Task :app:compileReleaseShaders NO-SOURCE
> Task :app:generateReleaseAssets UP-TO-DATE
> Task :app:mergeReleaseAssets
> Task :app:mergeReleaseJniLibFolders
> Task :app:mergeReleaseNativeLibs NO-SOURCE
> Task :app:stripReleaseDebugSymbols NO-SOURCE
> Task :app:writeReleaseAppMetadata
> Task :app:processReleaseManifestForPackage
> Task :app:mergeReleaseArtProfile
> Task :app:collectReleaseDependencies
> Task :app:configureReleaseDependencies
> Task :app:extractReleaseNativeSymbolTables NO-SOURCE
> Task :app:validateSigningRelease
> Task :app:parseReleaseIntegrityConfig
> Task :app:processReleaseResources
> Task :app:bundleReleaseResources
> Task :app:mergeExtDexRelease
> Task :app:compileReleaseKotlin FAILED
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:6:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:7:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:8:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:9:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:11:8 Unresolved reference: expo
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:13:22 Unresolved reference: ReactActivity
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:14:3 'onCreate' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:18:5 Unresolved reference: setTheme
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:19:11 Unresolved reference: onCreate
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:26:3 'getMainComponentName' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:32:3 'createReactActivityDelegate' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:32:47 Unresolved reference: ReactActivityDelegate
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:33:12 Unresolved reference: ReactActivityDelegateWrapper
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:36:20 Unresolved reference: DefaultReactActivityDelegate
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:38:15 Unresolved reference: mainComponentName
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:39:15 Unresolved reference: fabricEnabled
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:48:3 'invokeDefaultOnBackPressed' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:50:16 Unresolved reference: moveTaskToBack
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:52:21 Unresolved reference: invokeDefaultOnBackPressed
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainActivity.kt:59:13 Unresolved reference: invokeDefaultOnBackPressed
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:6:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:7:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:8:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:9:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:10:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:11:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:12:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:13:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:14:12 Unresolved reference: facebook
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:16:8 Unresolved reference: expo
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:17:8 Unresolved reference: expo
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:19:40 Unresolved reference: ReactApplication
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:21:3 'reactNativeHost' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:21:33 Unresolved reference: ReactNativeHost
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:21:51 Unresolved reference: ReactNativeHostWrapper
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:23:18 Unresolved reference: DefaultReactNativeHost
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:24:11 'getPackages' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:24:44 Unresolved reference: ReactPackage
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:25:28 Unresolved reference: PackageList
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:31:11 'getJSMainModuleName' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:33:11 'getUseDeveloperSupport' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:35:11 'isNewArchEnabled' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:36:11 'isHermesEnabled' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:40:3 'reactHost' overrides nothing
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:40:27 Unresolved reference: ReactHost
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:41:13 Unresolved reference: ReactNativeHostWrapper
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:45:5 Unresolved reference: SoLoader
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:45:25 Unresolved reference: OpenSourceMergedSoMapping
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:48:7 Unresolved reference: load
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:50:5 Unresolved reference: ApplicationLifecycleDispatcher
e: file:///home/expo/workingdir/build/android/app/src/main/java/com/anonymous/weeklycalorietracker/MainApplication.kt:55:5 Unresolved reference: ApplicationLifecycleDispatcher
FAILURE: Build failed with an exception.
* What went wrong:
Execution failed for task ':app:compileReleaseKotlin'.
> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction
   > Compilation error. See log for more details
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
BUILD FAILED in 50s
34 actionable tasks: 34 executed
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.