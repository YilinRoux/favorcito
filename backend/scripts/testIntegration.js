import mongoose from "mongoose";
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";

// Refuse a silently partial integration run. Tests create and drop dedicated databases.
if (!process.env.MONGO_TEST_URI) {
  console.error("MONGO_TEST_URI is required. Use an isolated MongoDB replica set for tests.");
  process.exit(1);
}
try {
  await mongoose.connect(process.env.MONGO_TEST_URI, { dbName: "favorcito_test_preflight", serverSelectionTimeoutMS: 10000 });
  const hello = await mongoose.connection.db.admin().command({ hello: 1 });
  if (!hello.setName || !hello.isWritablePrimary) throw new Error("A writable MongoDB replica set is required for transaction tests");
} catch (error) {
  console.error(`Integration database unavailable: ${error.message}`);
  process.exitCode = 1;
} finally {
  await mongoose.disconnect();
}
if (!process.exitCode) {
  const backend = fileURLToPath(new URL("../", import.meta.url));
  const files = readdirSync(new URL("../tests/", import.meta.url)).filter((file) => file.endsWith(".test.js")).sort().map((file) => `tests/${file}`);
  const result = spawnSync(process.execPath, ["--test", ...files], { cwd: backend, stdio: "inherit", env: process.env });
  process.exitCode = result.status ?? 1;
}
