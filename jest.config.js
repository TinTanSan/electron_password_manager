const { createDefaultPreset, pathsToModuleNameMapper } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  moduleNameMapper: {
    // Maps '@/' to the 'src' directory
    '^#main/(.*)$': '<rootDir>/main/$1'
  }
};