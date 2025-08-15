FAILURE: Build completed with 2 failures.
1: Task failed with an exception.
-----------
* What went wrong:
Execution failed for task ':app:compileReleaseKotlin'.
> A failure occurred while executing org.jetbrains.kotlin.compilerRunner.GradleCompilerRunnerWithWorkers$GradleKotlinCompilerWorkAction
   > Compilation error. See log for more details
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
==============================================================================
2: Task failed with an exception.
-----------
* Where:
Build file '/home/expo/workingdir/build/android/app/build.gradle' line: 12
* What went wrong:
Configuration cache problems found in this build.
7 problems were found storing the configuration cache, 6 of which seem unique.
- Build file '../node_modules/react-native-svg/android/build.gradle': line 47: external process started 'node --print require.resolve('react-native/package.json')'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
- Build file 'app/build.gradle': line 12: external process started 'node -e require('expo/scripts/resolveAppEntry') /home/expo/workingdir/build android absolute'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
- Build file 'app/build.gradle': line 13: external process started 'node --print require.resolve('react-native/package.json')'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
- Build file 'app/build.gradle': line 14: external process started 'node --print require.resolve('react-native/package.json')'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
- Build file 'app/build.gradle': line 15: external process started 'node --print require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
- Build file 'app/build.gradle': line 20: external process started 'node --print require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })'
  See https://docs.gradle.org/8.13/userguide/configuration_cache.html#config_cache:requirements:external_processes
See the complete report at file:///home/expo/workingdir/build/android/build/reports/configuration-cache/b8uqugc0h9mnqu65wjwmi19ug/cmu1b7hx61ehcpn0o2kli9tao/configuration-cache-report.html
> Starting an external process 'node -e require('expo/scripts/resolveAppEntry') /home/expo/workingdir/build android absolute' during configuration time is unsupported.
> Starting an external process 'node --print require.resolve('react-native/package.json')' during configuration time is unsupported.
> Starting an external process 'node --print require.resolve('react-native/package.json')' during configuration time is unsupported.
> Starting an external process 'node --print require.resolve('@react-native/codegen/package.json', { paths: [require.resolve('react-native/package.json')] })' during configuration time is unsupported.
> Starting an external process 'node --print require.resolve('@expo/cli', { paths: [require.resolve('expo/package.json')] })' during configuration time is unsupported.
* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.
==============================================================================
BUILD FAILED in 4m 41s
278 actionable tasks: 278 executed
Configuration cache entry discarded with 7 problems.
Error: Gradle build failed with unknown error. See logs for the "Run gradlew" phase for more information.