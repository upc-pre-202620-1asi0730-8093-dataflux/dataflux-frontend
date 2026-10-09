export function date(value) {
  return value instanceof Date && !Number.isNaN(value.getTime())
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : '—';
}
export function localDate(value, end = false) {
  return new Date(`${value}T${end ? '23:59:59.999' : '00:00:00'}`);
}
export function money(amount, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', { style: 'currency', currency }).format(amount);
}
