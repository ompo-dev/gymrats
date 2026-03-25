const { getDefaultConfig } = require("expo/metro-config");
const path = require("node:path");

const projectRoot = __dirname;
const monorepoRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// Watch the monorepo root for changes (needed for shared packages)
config.watchFolders = [monorepoRoot];

// Let Metro know where to resolve packages from (monorepo hoisting)
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(monorepoRoot, "node_modules"),
];

// Force Metro to always use the local version of react, react-dom and react-native
// Subpaths like react/jsx-runtime are also handled!
const forceLocalPackages = ["react", "react-dom", "react-native"];

const isForceLocal = (moduleName) => {
  for (const pkg of forceLocalPackages) {
    if (moduleName === pkg || moduleName.startsWith(`${pkg}/`)) {
      return true;
    }
  }
  return false;
};

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (isForceLocal(moduleName)) {
    // Reroute it from the local project directory index.js so Metro uses local local node_modules
    return context.resolveRequest(
      { ...context, originModulePath: path.resolve(projectRoot, "index.js") },
      moduleName,
      platform,
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
