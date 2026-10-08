import { PlanStatus } from './plan-status.enum.js';
export class SubscriptionPlan {
  #id;
  #name;
  #description;
  #price;
  #billingCycle;
  #status;
  constructor(props) {
    this.#id = props.id;
    this.#name = props.name;
    this.#description = props.description;
    this.#price = props.price;
    this.#billingCycle = props.billingCycle;
    this.#status = props.status ?? PlanStatus.ACTIVE;
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    this.#id = value;
  }
  get name() {
    return this.#name;
  }
  set name(value) {
    this.#name = value;
  }
  get description() {
    return this.#description;
  }
  set description(value) {
    this.#description = value;
  }
  get price() {
    return this.#price;
  }
  set price(value) {
    this.#price = value;
  }
  get billingCycle() {
    return this.#billingCycle;
  }
  set billingCycle(value) {
    this.#billingCycle = value;
  }
  get status() {
    return this.#status;
  }
  set status(value) {
    this.#status = value;
  }
}
