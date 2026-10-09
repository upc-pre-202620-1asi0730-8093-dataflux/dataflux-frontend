import { Money } from "../../../shared/domain/value-object/money.value-object.js";
export class RentalRate {
  #daily;
  #weekly;
  constructor({ dailyRate, weeklyRate, currency = "PEN" }) {
    if (
      !Number.isFinite(dailyRate) ||
      dailyRate <= 0 ||
      !Number.isFinite(weeklyRate) ||
      weeklyRate <= 0
    ) {
      throw new Error("Rental rates must be finite numbers greater than zero");
    }
    this.#daily = new Money({ amount: dailyRate, currency });
    this.#weekly = new Money({ amount: weeklyRate, currency });
    Object.freeze(this);
  }
  get dailyRate() {
    return this.#daily.amount;
  }
  get weeklyRate() {
    return this.#weekly.amount;
  }
  get dailyMoney() {
    return this.#daily;
  }
  get weeklyMoney() {
    return this.#weekly;
  }
  get currency() {
    return this.#daily.currency;
  }
}
