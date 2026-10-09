const DAY = 24 * 60 * 60 * 1000;
const LIMA_OFFSET = 5 * 60 * 60 * 1000;

function normalizedCode(code) {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
}

function scheduledPeriod(performedAt) {
  if (typeof performedAt !== "string") return null;
  const timestamp = Date.parse(performedAt);
  if (!Number.isFinite(timestamp)) return null;
  // The academic demo uses Peru's calendar, independently of the server's TZ.
  const day = new Date(timestamp - LIMA_OFFSET);
  const start = Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()) + LIMA_OFFSET;
  return {
    startDate: new Date(start).toISOString(),
    // DateRange.overlaps is inclusive; midnight of the next day must remain free.
    endDate: new Date(start + DAY - 1).toISOString(),
  };
}

function storedBlocks(blocks) {
  // Negative IDs are reserved for derived maintenance blocks; rentals retain
  // their positive IDs and rentalRequestId. Never persist a stale projection.
  return (Array.isArray(blocks) ? blocks : []).filter((block) => Number(block.id) >= 0);
}

function withScheduledBlocks(equipment, maintenances) {
  if (!equipment || equipment.id === undefined) return equipment;
  const scheduled = maintenances
    .filter((maintenance) =>
      String(maintenance.equipmentId) === String(equipment.id) &&
      maintenance.status === "SCHEDULED",
    )
    .flatMap((maintenance) => {
      const period = scheduledPeriod(maintenance.performedAt);
      const id = Number(maintenance.id);
      return period && Number.isInteger(id) && id > 0 ? [{ id: -id, ...period }] : [];
    });
  return {
    ...equipment,
    availabilityBlocks: [...storedBlocks(equipment.availabilityBlocks), ...scheduled],
  };
}

function equipmentWrite(router) {
  const db = router.db;
  return (req, res) => {
    const existing = req.params.id === undefined
      ? null
      : db.get("equipment").find((item) => String(item.id) === req.params.id).value();
    if (req.params.id !== undefined && !existing) {
      return res.status(404).json({ message: "Equipment not found" });
    }
    const candidate = req.method === "PUT" ? req.body : { ...existing, ...req.body };
    const userId = Number(candidate.userId);
    const code = normalizedCode(candidate.code);
    if (!Number.isInteger(userId) || userId <= 0 || !code) {
      return res.status(400).json({ message: "Equipment code and provider are required" });
    }
    const duplicate = db.get("equipment").value().some((item) =>
      Number(item.userId) === userId && normalizedCode(item.code) === code &&
      (!existing || String(item.id) !== String(existing.id)),
    );
    if (duplicate) {
      return res.status(409).json({
        code: "DUPLICATE_EQUIPMENT_CODE",
        message: "Equipment code already exists for this provider",
      });
    }
    if (Object.hasOwn(req.body, "code")) req.body.code = req.body.code.trim();
    if (Object.hasOwn(req.body, "availabilityBlocks")) {
      req.body.availabilityBlocks = storedBlocks(req.body.availabilityBlocks);
    }
    // Validation and mutation must occur together: json-server's delayed
    // middleware otherwise lets two simultaneous creates validate the same code.
    const collection = db.get("equipment");
    const resource = req.method === "POST"
      ? collection.insert(req.body).value()
      : req.method === "PATCH"
        ? collection.updateById(req.params.id, req.body).value()
        : collection.replaceById(req.params.id, req.body).value();
    db.write();
    if (req.method === "POST") {
      res.status(201);
      res.location(`${req.path.replace(/\/$/, "")}/${resource.id}`);
      res.setHeader("Access-Control-Expose-Headers", "Location");
    }
    res.locals.data = resource;
    router.render(req, res);
  };
}

function maintenanceWrite(db) {
  return (req, res, next) => {
    const existing = req.params.id === undefined
      ? null
      : db.get("maintenances").find((item) => String(item.id) === req.params.id).value();
    if (req.params.id !== undefined && !existing) return next();
    const candidate = req.method === "PUT" ? req.body : { ...existing, ...req.body };
    if (!scheduledPeriod(candidate.performedAt) ||
        typeof candidate.type !== "string" || !candidate.type.trim() ||
        !["SCHEDULED", "IN_PROGRESS", "COMPLETED"].includes(candidate.status)) {
      return res.status(400).json({ message: "Invalid maintenance information" });
    }
    const equipment = db.get("equipment")
      .find((item) => String(item.id) === String(candidate.equipmentId)).value();
    if (!equipment) return res.status(404).json({ message: "Maintenance equipment not found" });
    next();
  };
}

function installDemoEquipmentRules(server, router) {
  server.use((req, res, next) => {
    // express-urlrewrite overwrites originalUrl as well as url.
    res.locals.projectEquipment = /^\/api\/v1\/equipment(?:\/[^/]+)?\/?$/.test(req.path);
    next();
  });
  const validateEquipment = equipmentWrite(router);
  server.post("/api/v1/equipment", validateEquipment);
  server.patch("/api/v1/equipment/:id", validateEquipment);
  server.put("/api/v1/equipment/:id", validateEquipment);
  const validateMaintenance = maintenanceWrite(router.db);
  server.post("/api/v1/maintenances", validateMaintenance);
  server.patch("/api/v1/maintenances/:id", validateMaintenance);
  server.put("/api/v1/maintenances/:id", validateMaintenance);

  const render = router.render;
  router.render = (req, res) => {
    if (res.locals.projectEquipment) {
      const maintenances = router.db.get("maintenances").value() ?? [];
      const data = res.locals.data;
      res.locals.data = Array.isArray(data)
        ? data.map((equipment) => withScheduledBlocks(equipment, maintenances))
        : withScheduledBlocks(data, maintenances);
    }
    render(req, res);
  };
}

module.exports = { installDemoEquipmentRules };
