export class Money {
  #amount;
  #currency;
  constructor({ amount, currency }) {
    if (!Number.isFinite(amount) || amount < 0)
      throw new Error("Money amount must be a valid non-negative number");
    if (typeof currency !== "string" || !/^[A-Za-z]{3}$/.test(currency.trim()))
      throw new Error("Money currency must be a three-letter currency code");
    this.#amount = amount;
    this.#currency = currency.trim().toUpperCase();
    Object.freeze(this);
  }
  get amount() {
    return this.#amount;
  }
  get currency() {
    return this.#currency;
  }
}
