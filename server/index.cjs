const jsonServer = require("json-server");
const path = require("node:path");
const server = jsonServer.create();
const router = jsonServer.router(
  process.env.MAQUIGEST_DB || path.join(__dirname, "db.json"),
);
server.use(jsonServer.defaults());
server.use(jsonServer.bodyParser);
server.post("/api/v1/authentication/sign-up", (req, res) => {
  const { firstName, lastName, email, password, companyName, role } = req.body;
  if (
    !firstName?.trim() ||
    !lastName?.trim() ||
    !companyName?.trim() ||
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email ?? "") ||
    typeof password !== "string" ||
    password.length < 8 ||
    !["rental_company", "construction_company"].includes(role)
  ) {
    return res
      .status(400)
      .json({ message: "Invalid registration information" });
  }
  const db = router.db;
  if (
    db
      .get("users")
      .find((user) => user.email.toLowerCase() === email.toLowerCase())
      .value()
  )
    return res.status(409).json({ message: "Email already registered" });
  const id =
    Math.max(
      0,
      ...db
        .get("users")
        .value()
        .map((user) => Number(user.id)),
    ) + 1;
  const user = {
    id,
    email: email.trim().toLowerCase(),
    password,
    role,
    status: "active",
  };
  db.get("users").push(user).write();
  const profileId =
    Math.max(
      0,
      ...db
        .get("profiles")
        .value()
        .map((profile) => Number(profile.id)),
    ) + 1;
  db.get("profiles")
    .push({
      id: profileId,
      userId: id,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      contactEmail: user.email,
      phoneNumber: "",
      companyName: companyName.trim(),
      address: {
        street: "",
        district: "",
        city: "",
        country: "Peru",
        latitude: 0,
        longitude: 0,
      },
    })
    .write();
  res
    .status(201)
    .json({ ...user, password: undefined, firstName, lastName, companyName });
});
server.use(jsonServer.rewriter(require("./routes.json")));
server.use(router);
server.listen(Number(process.env.PORT || 3000), "127.0.0.1", () =>
  console.log("RentBuild Fake API ready"),
);
