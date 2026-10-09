export class Money {
  #amount;
  #currency;
  constructor(props) {
    if (!Number.isFinite(props.amount) || props.amount < 0) {
      throw new Error('Money amount must be a valid non-negative number');
    }
    if (!props.currency.trim()) {
      throw new Error('Money currency is required');
    }
    this.#amount = props.amount;
    this.#currency = props.currency.trim().toUpperCase();
  }
  get amount() {
    return this.#amount;
  }
  set amount(value) {
    this.#amount = value;
  }
  get currency() {
    return this.#currency;
  }
  set currency(value) {
    this.#currency = value.trim().toUpperCase();
  }
}
