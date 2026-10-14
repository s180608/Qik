const variant = process.env.QIK_APP_VARIANT === "rider" ? "rider" : "customer";
const rider = variant === "rider";
process.env.EXPO_PUBLIC_APP_VARIANT = variant;
const profile = process.env.EAS_BUILD_PROFILE || "";
const release =
  profile.startsWith("production") || profile.startsWith("preview");
if (release && !/^https:\/\//.test(process.env.EXPO_PUBLIC_API_URL || "")) {
  throw new Error(
    "Set EXPO_PUBLIC_API_URL to your HTTPS backend before building a preview or production app.",
  );
}
const prefix = process.env.QIK_APP_ID_PREFIX || "com.qik";
const projectId = rider
  ? process.env.QIK_RIDER_PROJECT_ID
  : process.env.QIK_CUSTOMER_PROJECT_ID;
module.exports = {
  expo: {
    name: rider ? "QIK Rider" : "QIK",
    slug: rider ? "qik-rider" : "qik-customer",
    version: "1.0.0",
    orientation: "portrait",
    icon: rider ? "./assets/rider-icon.png" : "./assets/qik-icon.png",
    scheme: rider ? "qik-rider" : "qik",
    userInterfaceStyle: "light",
    ios: {
      supportsTablet: true,
      bundleIdentifier: `${prefix}.${variant}`,
      config: { usesNonExemptEncryption: false },
      infoPlist: release
        ? {}
        : {
            NSAppTransportSecurity: {
              NSAllowsArbitraryLoads: true,
              NSAllowsLocalNetworking: true,
            },
          },
    },
    android: {
      package: `${prefix}.${variant}`,
      adaptiveIcon: {
        foregroundImage: rider
          ? "./assets/rider-adaptive.png"
          : "./assets/qik-adaptive.png",
        backgroundColor: rider ? "#183b2d" : "#cbf278",
      },
      permissions: [],
      blockedPermissions: [
        "android.permission.RECORD_AUDIO",
        "android.permission.ACCESS_FINE_LOCATION",
        "android.permission.ACCESS_COARSE_LOCATION",
      ],
    },
    web: { bundler: "metro", favicon: "./assets/qik-icon.png" },
    plugins: [
      "expo-router",
      "expo-font",
      ["expo-secure-store", { configureAndroidBackup: true }],
      [
        "expo-build-properties",
        { android: { usesCleartextTraffic: !release } },
      ],
    ],
    extra: { variant, ...(projectId ? { eas: { projectId } } : {}) },
  },
};
