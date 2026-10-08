export class AvailabilityBlock {
  #id;
  #period;
  constructor(props) {
    this.#id = props.id;
    this.#period = props.period;
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    this.#id = value;
  }
  get period() {
    return this.#period;
  }
  set period(value) {
    this.#period = value;
  }
  overlaps(period) {
    return this.#period.overlaps(period);
  }
}
