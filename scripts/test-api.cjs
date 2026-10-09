const fs = require("node:fs");
const path = require("node:path");
const dir = path.resolve(".test-runtime");
fs.mkdirSync(dir, { recursive: true });
const data = JSON.parse(
  fs
    .readFileSync(path.resolve("server/db.json"), "utf8")
    .replace(/^\uFEFF/, ""),
);
for (const key of [
  "equipment",
  "rental-requests",
  "rentals",
  "deliveries",
  "equipment-returns",
  "user-subscriptions",
  "maintenances",
  "incidents",
])
  data[key] = [];
process.env.MAQUIGEST_DB = path.join(dir, "db.json");
process.env.PORT = "3100";
fs.writeFileSync(process.env.MAQUIGEST_DB, JSON.stringify(data, null, 2));
require("../server/index.cjs");
