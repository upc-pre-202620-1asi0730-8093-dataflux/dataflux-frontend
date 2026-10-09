export const DEFAULT_LOCALE = "en-US";
export const SUPPORTED_LOCALES = Object.freeze(["en-US", "es-419"]);

export function resolveLocale(value) {
  if (typeof value !== "string") return DEFAULT_LOCALE;
  const alias = value.trim().replaceAll("_", "-").toLowerCase();
  if (alias === "en" || alias === "en-us") return "en-US";
  if (alias === "es" || alias === "es-419") return "es-419";
  return DEFAULT_LOCALE;
}

export function readLocalePreference(storage) {
  try {
    return resolveLocale(
      (storage ?? globalThis.localStorage)?.getItem("language"),
    );
  } catch {
    return DEFAULT_LOCALE;
  }
}

export function saveLocalePreference(value, storage) {
  const locale = resolveLocale(value);
  try {
    (storage ?? globalThis.localStorage)?.setItem("language", locale);
  } catch {
    // A blocked browser storage must not prevent changing the display language.
  }
  return locale;
}
