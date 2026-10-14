const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Keep customer/rider transforms separate when both dev servers run together.
config.cacheVersion = `${config.cacheVersion || ""}-qik-${process.env.QIK_APP_VARIANT || "customer"}`;
module.exports = config;
