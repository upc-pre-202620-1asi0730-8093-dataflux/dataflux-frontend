import { afterEach, expect, it } from 'vitest';
import { i18n } from '../../../i18n.js';
import { money } from './format.js';
const initialLocale = i18n.global.locale.value;
afterEach(() => { i18n.global.locale.value = initialLocale; });
it('formats equipment prices using the currently selected language', () => {
  for (const locale of ['en-US', 'es-419']) {
    i18n.global.locale.value = locale;
    expect(money(1234.5)).toBe(new Intl.NumberFormat(locale, { style: 'currency', currency: 'PEN' }).format(1234.5));
  }
});
