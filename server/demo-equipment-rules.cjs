function normalizedCode(code) {
  return typeof code === "string" ? code.trim().toUpperCase() : "";
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

function installDemoEquipmentRules(server, router) {
  const write = equipmentWrite(router);
  server.post("/api/v1/equipment", write);
  server.patch("/api/v1/equipment/:id", write);
  server.put("/api/v1/equipment/:id", write);
}
module.exports = { installDemoEquipmentRules };
