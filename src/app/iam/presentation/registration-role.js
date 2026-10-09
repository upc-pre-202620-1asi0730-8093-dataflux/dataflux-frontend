export const REGISTRATION_ROLES = Object.freeze([
  "construction_company",
  "rental_company",
]);

// A landing query selects a form option; session permissions still come from IAM.
export function resolveRegistrationRole(value) {
  return REGISTRATION_ROLES.includes(value) ? value : "construction_company";
}
