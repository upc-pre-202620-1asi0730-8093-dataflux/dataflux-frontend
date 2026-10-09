import { describe, expect, it } from "vitest";
import { resolveRegistrationRole } from "./registration-role.js";

describe("Landing registration segment", () => {
  it.each(["construction_company", "rental_company"])(
    "preselects the supported role %s",
    (role) => {
      expect(resolveRegistrationRole(role)).toBe(role);
    },
  );

  it.each([
    undefined,
    null,
    "",
    "admin",
    "RENTAL_COMPANY",
    ["rental_company"],
    { role: "rental_company" },
  ])("uses the default form option for an unsupported query %s", (value) => {
    expect(resolveRegistrationRole(value)).toBe("construction_company");
  });
});
