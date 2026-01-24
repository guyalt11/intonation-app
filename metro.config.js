
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Lock specific dependencies to the project's node_modules to avoid
// resolving conflicting versions from the parent directory (if any).
config.resolver.nodeModulesPaths = [path.resolve(__dirname, 'node_modules')];

// Ensure we don't watch the parent directory
config.watchFolders = [__dirname];

module.exports = config;
