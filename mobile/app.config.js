const googleIosUrlScheme = process.env.EXPO_PUBLIC_GOOGLE_IOS_URL_SCHEME?.trim();

const plugins = [
  'expo-router',
  [
    'expo-splash-screen',
    {
      backgroundColor: '#208AEF',
      android: {
        image: './assets/images/splash-icon.png',
        imageWidth: 76,
      },
    },
  ],
  'expo-secure-store',
  'expo-notifications',
  'expo-iap',
  'expo-web-browser',
  'expo-apple-authentication',
];

if (googleIosUrlScheme) {
  plugins.push([
    '@react-native-google-signin/google-signin',
    {
      iosUrlScheme: googleIosUrlScheme,
    },
  ]);
}

module.exports = {
  expo: {
    name: 'Autoservice App',
    slug: 'autoservice-app',
    version: '1.0.0',
    orientation: 'portrait',
    icon: './assets/images/icon.png',
    scheme: 'autoservice-app',
    userInterfaceStyle: 'automatic',
    ios: {
      bundleIdentifier: 'com.autoservice.app',
      icon: './assets/expo.icon',
      usesAppleSignIn: true,
    },
    android: {
      package: 'com.autoservice.app',
      adaptiveIcon: {
        backgroundColor: '#E6F4FE',
        foregroundImage: './assets/images/android-icon-foreground.png',
        backgroundImage: './assets/images/android-icon-background.png',
        monochromeImage: './assets/images/android-icon-monochrome.png',
      },
      predictiveBackGestureEnabled: false,
    },
    web: {
      output: 'static',
      favicon: './assets/images/favicon.png',
    },
    plugins,
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
  },
};
