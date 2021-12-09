export default {
    verbose: true,
    testRegex: "src\\/.*\\.spec\\.(ts|tsx)$",
    moduleDirectories: [
      "node_modules"
    ],
    transform: {
      ".*\\.ts": "@swc-node/jest"
       
    },
    moduleFileExtensions: [
      "ts",
      "tsx",
      "js"
    ]
  }