import { createI18n } from 'vue-i18n';
import es from './locales/es.json';
import en from './locales/en.json';
function normalize(value) {
  if (typeof value === 'string')
    return value.replace(/\{\{(\w+)\}\}/g, '{$1}').replace(/@/g, "{'@'}");
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, normalize(item)]));
}
const common = {
  es: {
    loading: 'Cargando…',
    save: 'Guardar',
    cancel: 'Cancelar',
    detail: 'Ver detalle',
    search: 'Buscar',
    all: 'Todos',
    empty: 'No hay registros.',
    back: 'Volver',
    success: 'Operación completada.',
    confirm: 'Confirmar',
    invalid: 'Revisa los datos ingresados.',
    language: 'Idioma',
  },
  en: {
    loading: 'Loading…',
    save: 'Save',
    cancel: 'Cancel',
    detail: 'View details',
    search: 'Search',
    all: 'All',
    empty: 'No records yet.',
    back: 'Back',
    success: 'Operation completed.',
    confirm: 'Confirm',
    invalid: 'Review the entered information.',
    language: 'Language',
  },
};
export const i18n = createI18n({
  legacy: false,
  locale: localStorage.getItem('language') || 'es',
  fallbackLocale: 'en',
  messages: {
    es: { ...normalize(es), common: common.es },
    en: { ...normalize(en), common: common.en },
  },
});
