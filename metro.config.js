const { getDefaultConfig } = require("expo/metro-config");

/**
 * Paperclip's UI uses typed design tokens and StyleSheet plus native
 * Jetpack Compose controls. NativeWind is no longer part of the runtime graph;
 * dropping its wrapper also keeps the react-native-css polyfill out of the app.
 */
/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

module.exports = config;
