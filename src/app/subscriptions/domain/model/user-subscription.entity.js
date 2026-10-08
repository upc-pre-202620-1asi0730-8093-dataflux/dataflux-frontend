import { SubscriptionStatus } from './subscription-status.enum.js';
export class UserSubscription {
  #id;
  #userId;
  #planId;
  #period;
  #status;
  #autoRenew;
  constructor(props) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#planId = props.planId;
    this.#period = props.period;
    this.#status = props.status ?? SubscriptionStatus.ACTIVE;
    this.#autoRenew = props.autoRenew ?? true;
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    this.#id = value;
  }
  get userId() {
    return this.#userId;
  }
  set userId(value) {
    this.#userId = value;
  }
  get planId() {
    return this.#planId;
  }
  set planId(value) {
    this.#planId = value;
  }
  get period() {
    return this.#period;
  }
  set period(value) {
    this.#period = value;
  }
  get status() {
    return this.#status;
  }
  set status(value) {
    this.#status = value;
  }
  get autoRenew() {
    return this.#autoRenew;
  }
  set autoRenew(value) {
    this.#autoRenew = value;
  }
}
