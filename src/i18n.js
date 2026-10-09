import { createI18n } from "vue-i18n";
import es from "./locales/es.json";
import en from "./locales/en.json";
import {
  DEFAULT_LOCALE,
  readLocalePreference,
} from "./app/shared/presentation/locale-preference.js";
function normalize(value) {
  if (typeof value === "string")
    return value.replace(/\{\{(\w+)\}\}/g, "{$1}").replace(/@/g, "{'@'}");
  return Object.fromEntries(
    Object.entries(value).map(([key, item]) => [key, normalize(item)]),
  );
}
const common = {
  es: {
    loading: "Cargando…",
    save: "Guardar",
    cancel: "Cancelar",
    detail: "Ver detalle",
    search: "Buscar",
    all: "Todos",
    empty: "No hay registros.",
    back: "Volver",
    success: "Operación completada.",
    confirm: "Confirmar",
    invalid: "Revisa los datos ingresados.",
    language: "Idioma",
    "skip-content": "Saltar al contenido",
  },
  en: {
    loading: "Loading…",
    save: "Save",
    cancel: "Cancel",
    detail: "View details",
    search: "Search",
    all: "All",
    empty: "No records yet.",
    back: "Back",
    success: "Operation completed.",
    confirm: "Confirm",
    invalid: "Review the entered information.",
    language: "Language",
    "skip-content": "Skip to content",
  },
};
const english = { ...normalize(en), common: common.en };
const spanish = { ...normalize(es), common: common.es };
export const i18n = createI18n({
  legacy: false,
  locale: readLocalePreference(),
  fallbackLocale: DEFAULT_LOCALE,
  messages: {
    "en-US": english,
    "es-419": spanish,
    en: english,
    es: spanish,
    en_US: english,
    es_419: spanish,
  },
});
