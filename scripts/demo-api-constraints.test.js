import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let child;
let directory;
let databasePath;
let baseUrl;

function equipment(id, userId, code, availabilityBlocks = []) {
  return {
    id, userId, code, name: "Demo excavator", description: "Test equipment",
    categoryId: 1, location: "Lima", dailyRate: 50, weeklyRate: 250,
    currency: "PEN", status: "AVAILABLE", availabilityBlocks,
  };
}

async function request(method, endpoint, body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, body: await response.json() };
}

beforeEach, describe, expect, it } from "vitest";
import { spawn } from "node:child_process";
import { once } from "node:events";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:net";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
let child;
let directory;
let databasePath;
let baseUrl;

function equipment(id, userId, code, availabilityBlocks = []) {
  return {
    id, userId, code, name: "Demo excavator", description: "Test equipment",
    categoryId: 1, location: "Lima", dailyRate: 50, weeklyRate: 250,
    currency: "PEN", status: "AVAILABLE", availabilityBlocks,
  };
}

async function request(method, endpoint, body) {
  const response = await fetch(`${baseUrl}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    signal: AbortSignal.timeout(5000),
  });
  return { status: response.status, body: await response.json() };
}

function schedule(equipmentId = 1, overrides = {}) {
  return request("POST", "/maintenances", {
    equipmentId, performedAt: "2030-03-20T05:00:00.000Z",
    type: "Preventive service", status: "SCHEDULED", ...overrides,
  });
}

function isAvailable(resource, instant) {
  const date = new Date(instant);
  return assembler.toEntityFromResource(resource).isAvailableFor(
    new DateRange({ startDate: date, endDate: date }),
  );
}

beforeEach(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "rentbuild-api-constraints-"));
  databasePath = path.join(directory, "db.json");
  await writeFile(databasePath, JSON.stringify({
    users: [{ id: 1 }, { id: 2 }, { id: 4 }], profiles: [], maintenances: [],
    equipment: [
      equipment(1, 1, "EXC-001"), equipment(2, 1, "CRANE-001"),
      equipment(3, 2, "EXC-001"),
      equipment(4, 4, "TEST-004", [{
        id: 17, rentalRequestId: 9,
        startDate: "2030-03-22T05:00:00.000Z", endDate: "2030-03-25T05:00:00.000Z",
      }]),
    ],
  }));
  const probe = createServer();
  probe.listen(0, "127.0.0.1");
  await once(probe, "listening");
  const port = probe.address().port;
  await new Promise((resolve, reject) => probe.close((error) => error ? reject(error) : resolve()));
  baseUrl = `http://127.0.0.1:${port}/api/v1`;
  child = spawn(process.execPath, [path.join(root, "server/index.cjs")], {
    cwd: root,
    // UTC intentionally differs from Lima, to catch host-dependent day boundaries.
    env: { ...process.env, PORT: String(port), MAQUIGEST_DB: databasePath, TZ: "UTC" },
    stdio: ["ignore", "pipe", "pipe"],
  });
  await new Promise((resolve, reject) => {
    let output = "";
    const timeout = setTimeout(() => reject(new Error("Fake API startup timed out")), 8000);
    child.once("error", (error) => { clearTimeout(timeout); reject(error); });
    child.once("exit", (code) => {
      clearTimeout(timeout);
      reject(new Error(`Fake API exited during startup (${code})`));
    });
    child.stdout.on("data", (chunk) => {
      output += chunk.toString();
      if (output.includes("RentBuild Fake API ready")) {
        clearTimeout(timeout);
        resolve();
      }
    });
  });
}, 15000);

afterEach(async () => {
  if (child && child.exitCode === null) {
    const exited = once(child, "exit");
    child.kill();
    await exited;
  }
  child = undefined;
  if (directory) {
    const relative = path.relative(tmpdir(), directory);
    if (relative.startsWith("..") || path.isAbsolute(relative) ||
        !relative.startsWith("rentbuild-api-constraints-")) {
      throw new Error("Refusing cleanup outside the test's temporary directory");
    }
    await rm(directory, { recursive: true, force: true });
    directory = undefined;
  }
}, 15000);

describe("real demo API equipment constraints", () => {
  it("rejects duplicate codes for the same provider regardless of case or surrounding spaces", async () => {
    const result = await request("POST", "/equipment", equipment(0, 1, "  exc-001  "));
    expect(result.status).toBe(409);
    expect(result.body.code).toBe("DUPLICATE_EQUIPMENT_CODE");
    const list = await request("GET", "/equipment?userId=1");
    expect(list.body.map((item) => item.code)).toEqual(["EXC-001", "CRANE-001"]);
  });

  it("allows another provider to use the same equipment code", async () => {
    const result = await request("POST", "/equipment", equipment(0, 7, "EXC-001"));
    expect(result.status).toBe(201);
    expect(result.body.userId).toBe(7);
    expect(result.body.id).toBeGreaterThan(0);
  });

  it("rejects an edit that would collide and preserves the stored equipment", async () => {
    const before = await request("GET", "/equipment/2");
    const patch = await request("PATCH", "/equipment/2", { code: "exc-001", name: "Changed" });
    expect(patch.status).toBe(409);
    const after = await request("GET", "/equipment/2");
    expect(after.body).toEqual(before.body);
  });

  it("applies the same uniqueness rule to PUT", async () => {
    const result = await request("PUT", "/equipment/2", equipment(2, 1, "EXC-001"));
    expect(result.status).toBe(409);
    expect((await request("GET", "/equipment/2")).body.code).toBe("CRANE-001");
  });

  it("allows editing the same equipment without treating its own code as a duplicate", async () => {
    const result = await request("PATCH", "/equipment/1", { code: "EXC-001", name: "Edited" });
    expect(result.status).toBe(200);
    expect(result.body).toMatchObject({ id: 1, userId: 1, code: "EXC-001", name: "Edited" });
  });

  it("accepts only one of two competing duplicate creates", async () => {
    const results = await Promise.all([
      request("POST", "/equipment", equipment(0, 9, "ONE-CODE")),
      request("POST", "/equipment", equipment(0, 9, "one-code")),
    ]);
    expect(results.map((result) => result.status).sort()).toEqual([201, 409]);
    expect((await request("GET", "/equipment?userId=9")).body).toHaveLength(1);
  });

});
