function validateAmount(value) {
  if (!Number.isFinite(value) || value < 0) {
    throw new RangeError("Money amount must be a valid non-negative number");
  }
  return value === 0 ? 0 : value;
}

function normalizeCurrency(value) {
  if (typeof value !== "string" || !/^[a-z]{3}$/i.test(value.trim())) {
    throw new RangeError("Money currency must be a three-letter code");
  }
  return value.trim().toUpperCase();
}

export class Money {
  #amount;
  #currency;
  constructor(props = {}) {
    this.#amount = validateAmount(props?.amount);
    this.#currency = normalizeCurrency(props?.currency);
  }
  get amount() {
    return this.#amount;
  }
  set amount(value) {
    this.#amount = validateAmount(value);
  }
  get currency() {
    return this.#currency;
  }
  set currency(value) {
    this.#currency = normalizeCurrency(value);
  }
}
