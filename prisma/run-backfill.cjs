/**
 * CJS entry so ts-node compiles backfill-all-sources.ts as CommonJS (__dirname works; no Node ESM .ts warning).
 * Args after the script name are forwarded (e.g. --dry-run, --only=crushon).
 */
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, "..", ".env") });
require("dotenv").config({ path: path.join(__dirname, "..", ".env.local") });

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "CommonJS",
    esModuleInterop: true,
    moduleResolution: "node",
  },
});

require(path.join(__dirname, "backfill-all-sources.ts"));
