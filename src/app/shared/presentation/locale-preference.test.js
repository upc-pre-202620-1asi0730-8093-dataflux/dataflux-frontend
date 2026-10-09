import { afterEach, describe, expect, it, vi } from "vitest";
import {
  readLocalePreference,
  resolveLocale,
  saveLocalePreference,
} from "./locale-preference.js";

afterEach(() => vi.unstubAllGlobals());

describe("Canonical display language", () => {
  it.each([
    ["en", "en-US"],
    ["en-US", "en-US"],
    ["en_US", "en-US"],
    ["es", "es-419"],
    ["es-419", "es-419"],
    ["es_419", "es-419"],
    [" ES_419 ", "es-419"],
  ])("resolves the saved preference %s to %s", (value, expected) => {
    expect(resolveLocale(value)).toBe(expected);
    const storage = {
      getItem: vi.fn().mockReturnValue(value),
      setItem: vi.fn(),
    };
    expect(readLocalePreference(storage)).toBe(expected);
    expect(storage.getItem).toHaveBeenCalledWith("language");
    expect(storage.setItem).not.toHaveBeenCalled();
  });

  it.each([null, undefined, "", "fr-FR", ["es"]])(
    "defaults to English for %s",
    (value) => {
      expect(resolveLocale(value)).toBe("en-US");
    },
  );

  it("persists canonical values when the user changes language", () => {
    const storage = { setItem: vi.fn() };
    expect(saveLocalePreference("es", storage)).toBe("es-419");
    expect(storage.setItem).toHaveBeenCalledWith("language", "es-419");
  });

  it("keeps language selection available when browser storage is blocked", () => {
    const storage = {
      getItem: () => {
        throw new Error("Storage blocked");
      },
      setItem: () => {
        throw new Error("Storage blocked");
      },
    };
    expect(readLocalePreference(storage)).toBe("en-US");
    expect(saveLocalePreference("es", storage)).toBe("es-419");
  });

  it.each([
    [null, "en-US", "Save"],
    ["es_419", "es-419", "Guardar"],
  ])(
    "initializes the actual translation catalog from %s",
    async (saved, locale, translated) => {
      vi.resetModules();
      vi.stubGlobal("localStorage", { getItem: () => saved });
      const { i18n } = await import("../../../i18n.js");
      expect(i18n.global.locale.value).toBe(locale);
      expect(i18n.global.t("common.save")).toBe(translated);
    },
  );
});
