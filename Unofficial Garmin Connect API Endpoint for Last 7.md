
# Polyfilling Node.js Core Modules in React Native with Metro

**Key Takeaway:**
To run a Node-centric library like `garmin-connect` under React Native, you must explicitly polyfill or stub out the missing core-module APIs. This is done via a custom Metro configuration (not via `rn-nodeify`), plus installing lightweight polyfill packages.

## 1. Install Core-Module Polyfills

Add these packages (minimum set for HTTP/OAuth flows):

```bash
yarn add \
  crypto-browserify \
  stream-browserify \
  buffer \
  url \
  path-browserify \
  assert \
  os-browserify \
  readable-stream
```

You’ll also want an “empty” stub for modules you don’t actually use:

```bash
yarn add empty-module
```


## 2. Create or Update `metro.config.js`

At your project root, add a `metro.config.js` with **extraNodeModules** that map core imports to React Native–compatible implementations or stubs:

```javascript
// metro.config.js
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const nodeLibs = {
  // Real polyfills
  crypto: require.resolve('crypto-browserify'),
  stream: require.resolve('stream-browserify'),
  buffer: require.resolve('buffer'),
  url: require.resolve('url'),
  path: require.resolve('path-browserify'),
  assert: require.resolve('assert'),
  os: require.resolve('os-browserify'),
  // Stubs for unused modules
  http: require.resolve('empty-module'),
  https: require.resolve('empty-module'),
  zlib: require.resolve('empty-module'),
  tls: require.resolve('empty-module'),
};

const defaultConfig = getDefaultConfig(__dirname);

module.exports = mergeConfig(defaultConfig, {
  resolver: {
    extraNodeModules: new Proxy(nodeLibs, {
      get: (target, name) =>
        // fallback to project’s own node_modules
        target[name] || path.join(__dirname, `node_modules/${name}`)
    }),
    // Include common extensions
    sourceExts: [...defaultConfig.resolver.sourceExts, 'cjs'],
  },
  transformer: {
    // Enable inline requires if you like
    getTransformOptions: async () => ({
      transform: { experimentalImportSupport: false, inlineRequires: true }
    }),
  },
});
```

This tells Metro to rewrite any `require('crypto')`, `require('stream')`, etc., to the polyfills you installed, and to stub out modules you won’t use (e.g. `http`, `https`, `zlib`) via `empty-module` [^3_1].

## 3. Import Global Polyfills (if needed)

Some libraries expect globals like `Buffer`. In your app entry (e.g. `index.js`), add at top:

```javascript
import 'buffer';
import { decode, encode } from 'base-64';
global.atob = decode;
global.btoa = encode;
```

For `Buffer` specifically:

```javascript
import { Buffer } from 'buffer';
global.Buffer = Buffer;
```


## 4. Clear Metro Cache and Rebuild

Whenever you change Metro config or install new polyfills, restart Metro with a clean cache:

```bash
npx react-native start --reset-cache
```


## 5. Verify

1. Launch your app.
2. In JavaScript console, run:

```js
console.log(typeof global.Buffer, typeof require('crypto'));
```

You should see `"function"` and `"object"` (or `"function"`), not `undefined`.
3. Retry your Garmin-Connect login routine; the Node APIs should now resolve correctly.

**Outcome:**
With these steps, you’ve swapped in Metro’s own Node.js polyfilling (via `metro-react-native-babel-preset` and `metro.config.js`) instead of `rn-nodeify`. Your React Native packager will now recognize and bundle the core modules needed by the Garmin-Connect library.

<div style="text-align: center">⁂</div>

[^3_1]: https://web3auth.io/docs/troubleshooting/metro-issues

[^3_2]: https://stackoverflow.com/questions/60021119/how-can-i-stop-my-react-native-tests-bombing-out-on-flow-types-in-node-modules

[^3_3]: https://github.com/facebook/react-native/issues/33426

[^3_4]: https://www.npmjs.com/package/metro-react-native-babel-preset

[^3_5]: https://github.com/react-native-community/upgrade-support/issues/152

[^3_6]: https://stackoverflow.com/questions/52564252/react-native-0-57-cant-find-variable-require-with-metro-react-native-babel/52568768

[^3_7]: https://stackoverflow.com/questions/52564252/react-native-0-57-cant-find-variable-require-with-metro-react-native-babel

[^3_8]: https://web3auth.io/docs/troubleshooting/metro-issues-mpc

[^3_9]: https://www.npmjs.com/package/@appidea/react-native-node-polyfill

[^3_10]: https://www.npmjs.com/package/@ethicdevs/metro-webpack-react-native-web-babel-preset

[^3_11]: https://babeljs.io/docs/babel-preset-react

[^3_12]: https://github.com/expo/expo/issues/27070

[^3_13]: https://deps.dev/npm/metro-react-native-babel-transformer/0.64.0/compare

[^3_14]: https://metrobundler.dev/docs/configuration

[^3_15]: https://www.npmjs.com/package/react-native-url-polyfill

[^3_16]: https://github.com/expo/expo/issues/24260

[^3_17]: https://deps.dev/npm/react-native/0.0.0-d477f8011/compare

[^3_18]: https://www.clouddefense.ai/code/javascript/example/metro-config

[^3_19]: https://docs.expo.dev/versions/latest/config/metro/

[^3_20]: https://github.com/acostalima/react-native-polyfill-globals


---

# Setting up garmin-connect Library with React Native CLI

Based on your React Native CLI stack (Node.js >= 16, React Native CLI, Xcode 14+, Android Studio with SDK 31+), here's a comprehensive guide to get the `garmin-connect` library working with proper Node.js polyfills.

## Step 1: Install Required Dependencies

First, install the `garmin-connect` library and necessary Node.js polyfills:

```bash
npm install garmin-connect

# Install polyfill packages
npm install crypto-browserify stream-browserify buffer os-browserify path-browserify assert url readable-stream empty-module react-native-get-random-values

# Optional: For better crypto performance (recommended)
npm install react-native-quick-crypto
```


## Step 2: Create/Update metro.config.js

Create or update your `metro.config.js` file in your project root:

```javascript
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration for React Native CLI with Node.js polyfills
 * @type {import('metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      // Core Node.js modules polyfills
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      url: require.resolve('url'),
      path: require.resolve('path-browserify'),
      assert: require.resolve('assert'),
      os: require.resolve('os-browserify'),
      
      // Stub out unused modules with empty-module
      http: require.resolve('empty-module'),
      https: require.resolve('empty-module'),
      zlib: require.resolve('empty-module'),
      tls: require.resolve('empty-module'),
      net: require.resolve('empty-module'),
      fs: require.resolve('empty-module'),
    },
  },
  transformer: {
    getTransformOptions: async () => ({
      transform: {
        experimentalImportSupport: false,
        inlineRequires: true,
      },
    }),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```


## Step 3: Add Global Polyfills

Create a `polyfills.js` file in your project root:

```javascript
// polyfills.js
import 'react-native-get-random-values';
import { Buffer } from 'buffer';

// Set up global Buffer
global.Buffer = Buffer;

// Set up btoa/atob for base64 encoding/decoding
import { decode, encode } from 'base-64';
if (!global.btoa) {
  global.btoa = encode;
}
if (!global.atob) {
  global.atob = decode;
}

// Process polyfill
global.process = require('process');
```


## Step 4: Import Polyfills in Your App Entry Point

In your main app entry file (`index.js` or `App.js`), import the polyfills first:

```javascript
// index.js
import './polyfills';
import { AppRegistry } from 'react-native';
import App from './App';
import { name as appName } from './app.json';

AppRegistry.registerComponent(appName, () => App);
```


## Step 5: Install base64-js for base64 operations

```bash
npm install base-64
```


## Step 6: Use garmin-connect in Your App

Now you can use the garmin-connect library:

```typescript
// GarminService.ts
import { GarminConnect } from 'garmin-connect';

export class GarminService {
  private gc: GarminConnect;

  constructor(username: string, password: string) {
    this.gc = new GarminConnect({
      username,
      password,
    });
  }

  async login(): Promise<void> {
    try {
      await this.gc.login();
      console.log('Garmin Connect login successful');
    } catch (error) {
      console.error('Garmin Connect login failed:', error);
      throw error;
    }
  }

  async getActivitiesLast7Days(): Promise<any[]> {
    try {
      const endDate = new Date().toISOString().split('T')[^4_0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[^4_0];

      // Use the library's built-in method
      const activities = await this.gc.getActivitiesByDate(startDate, endDate);
      return activities;
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      throw error;
    }
  }

  async getCustomActivitiesEndpoint(): Promise<any> {
    // Extract tokens for custom requests
    const accessToken = this.gc.client.oauth2Token?.access_token;
    const fgpCookie = this.gc.client.session?.cookies['JWT_FGP'];

    if (!accessToken || !fgpCookie) {
      throw new Error('Not authenticated. Please login first.');
    }

    // Make custom request to the activities endpoint
    const response = await fetch(
      'https://connect.garmin.com/modern/proxy/activitylist-service/activities/search/activities',
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Cookie: `JWT_FGP=${fgpCookie}`,
          'DI-Backend': 'connectapi.garmin.com',
        },
        // Add query parameters for last 7 days
        // Note: You'd need to construct the full URL with query params
      }
    );

    return response.json();
  }
}
```


## Step 7: Usage Example

```typescript
// App.tsx
import React, { useEffect, useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';
import { GarminService } from './GarminService';

const App = () => {
  const [garminService, setGarminService] = useState<GarminService | null>(null);
  const [activities, setActivities] = useState<any[]>([]);

  const initializeGarmin = () => {
    const service = new GarminService(
      'your-garmin-email@example.com',
      'your-password'
    );
    setGarminService(service);
  };

  const loginAndFetchActivities = async () => {
    if (!garminService) {
      Alert.alert('Error', 'Please initialize Garmin service first');
      return;
    }

    try {
      await garminService.login();
      const last7DaysActivities = await garminService.getActivitiesLast7Days();
      setActivities(last7DaysActivities);
      Alert.alert('Success', `Fetched ${last7DaysActivities.length} activities`);
    } catch (error) {
      Alert.alert('Error', `Failed to fetch activities: ${error}`);
    }
  };

  return (
    <View style={{ flex: 1, padding: 20, justifyContent: 'center' }}>
      <Text>Garmin Connect Integration</Text>
      <Button title="Initialize Garmin" onPress={initializeGarmin} />
      <Button 
        title="Login & Fetch Activities" 
        onPress={loginAndFetchActivities}
        disabled={!garminService}
      />
      <Text>Activities found: {activities.length}</Text>
    </View>
  );
};

export default App;
```


## Step 8: Clear Metro Cache and Run

After setting up the configuration:

```bash
# Clear Metro cache
npx react-native start --reset-cache

# Run on iOS
npx react-native run-ios

# Run on Android
npx react-native run-android
```


## Alternative: Use react-native-quick-crypto (Recommended)

For better performance, you can replace `crypto-browserify` with `react-native-quick-crypto`:

1. Install react-native-quick-crypto:
```bash
npm install react-native-quick-crypto
cd ios && pod install # For iOS
```

2. Update your `metro.config.js` to use quick-crypto:
```javascript
const config = {
  resolver: {
    extraNodeModules: {
      crypto: require.resolve('react-native-quick-crypto'),
      // ... other polyfills
    },
  },
};
```


## Troubleshooting

1. **Build fails on iOS**: Make sure to run `cd ios && pod install` after installing react-native-quick-crypto
2. **Android build issues**: You might need to add packaging options to handle native library conflicts
3. **Metro cache issues**: Always clear cache when changing metro config: `npx react-native start --reset-cache`
4. **Authentication errors**: Ensure your Garmin credentials are correct and account doesn't have 2FA enabled

This setup provides a complete Node.js polyfill environment that allows the `garmin-connect` library to work properly in your React Native CLI app.

<div style="text-align: center">⁂</div>

[^4_1]: https://github.com/malgorzatamaz/react-native-garmin-connect

[^4_2]: https://www.youtube.com/watch?v=CRQOkie6Ej8

[^4_3]: https://stackoverflow.com/questions/64107379/how-to-integrate-oauth-sign-in-using-garmin-for-react-native-application

[^4_4]: https://www.npmjs.com/package/garmin-connect

[^4_5]: https://reactnative.dev/docs/the-new-architecture/create-module-library

[^4_6]: https://web3auth.io/docs/troubleshooting/metro-issues

[^4_7]: https://stackoverflow.com/questions/29836434/requiring-unknown-module-crypto-in-react-native-environment

[^4_8]: https://www.npmjs.com/package/@mzhu22-mayo/react-native-connect-iq-mobile-sdk

[^4_9]: https://www.clouddefense.ai/code/javascript/example/metro-config

[^4_10]: https://www.npmjs.com/package/react-native-polyfill-globals

[^4_11]: https://reactnative.dev/docs/linking-libraries-ios

[^4_12]: https://github.com/expo/expo/issues/22323

[^4_13]: https://www.reddit.com/r/expo/comments/ue3q4g/node_polyfills_in_expo_android/

[^4_14]: https://reactnative-archive-august-2023.netlify.app/docs/0.63/environment-setup

[^4_15]: https://github.com/expo/expo/issues/27070

[^4_16]: https://github.com/auth0/react-native-auth0/issues/276

[^4_17]: https://github.com/bombsimon/awesome-garmin

[^4_18]: https://www.npmjs.com/package/@react-native/metro-config

[^4_19]: https://bsky.app/profile/did:plc:xpxsa5aviwecd7cv6bzbmr5n

[^4_20]: https://forums.garmin.com/developer/connect-iq/f/discussion/264962/react-native-integration-for-fetching-activity-data-with-api

[^4_21]: https://metrobundler.dev/docs/configuration

[^4_22]: https://stackoverflow.com/questions/75215120/unable-to-resolve-module-crypto

[^4_23]: https://www.npmjs.com/package/react-native-quick-crypto?activeTab=dependencies

[^4_24]: https://github.com/solana-foundation/solana-com/blob/main/content/courses/mobile/solana-mobile-dapps-with-expo.mdx

[^4_25]: https://web3auth.io/docs/troubleshooting/webpack-issues

[^4_26]: https://github.com/parcel-bundler/parcel/issues/10079

[^4_27]: https://docs.request.network/advanced/request-network-sdk/sdk-guides/mobile-using-expo

[^4_28]: https://www.npmjs.com/package/@appidea/react-native-node-polyfill

[^4_29]: https://stackoverflow.com/questions/48432524/how-do-i-resolve-a-cant-find-variable-buffer-error

[^4_30]: https://web3auth.io/community/t/refferece-error-buffer-don-t-exist/10981

[^4_31]: https://parceljs.org/features/node-emulation/

[^4_32]: https://github.com/margelo/react-native-quick-crypto

[^4_33]: https://docs.expo.dev/versions/latest/config/metro/

[^4_34]: https://stackoverflow.com/questions/78650332/using-npm-to-create-react-app-breaking-change-webpack-5-used-to-include-poly

[^4_35]: https://www.npmjs.com/package/react-native-quick-crypto/v/0.7.0-rc.0

[^4_36]: https://classic.yarnpkg.com/en/package/react-native-polyfill-globals

[^4_37]: https://github.com/react-native-community/upgrade-support/issues/152

[^4_38]: https://www.reddit.com/r/reactjs/comments/vwnjuo/webpack_5_polyfill_breaking_changes_solved_with/

[^4_39]: https://www.npmjs.com/package/@tbd54566975%2Fweb5-react-native-polyfills

[^4_40]: https://www.npmjs.com/package/react-native-quick-crypto

[^4_41]: https://www.npmjs.com/package/react-native-fast-crypto

[^4_42]: https://github.com/margelo/react-native-quick-crypto/blob/main/docs/implementation-coverage.md

[^4_43]: https://github.com/margelo/react-native-quick-crypto/issues/299

[^4_44]: https://reactnative.dev/docs/metro

[^4_45]: https://www.reddit.com/r/reactnative/comments/16o5ett/expo_development_build_fails_with/

[^4_46]: https://microsoft.github.io/react-native-windows/docs/0.66/metro-config-out-tree-platforms

[^4_47]: https://docs.expo.dev/versions/latest/sdk/crypto/

[^4_48]: https://andrei-calazans.com/posts/2022-12-12-til-overriding-nodejs-module-with-metro/

[^4_49]: https://veramo.io/docs/react_native_tutorials/react_native_1_setup_identifiers/

[^4_50]: https://docs.metamask.io/sdk/connect/react-native/

[^4_51]: https://reactnative.dev/docs/environment-setup

[^4_52]: https://github.com/parshap/node-libs-react-native/blob/master/README.md

[^4_53]: https://stackoverflow.com/questions/74032259/how-can-i-configure-metro-to-resolve-modules-outside-of-my-project-directory

[^4_54]: https://microsoft.github.io/rnx-kit/docs/tools/metro-config

