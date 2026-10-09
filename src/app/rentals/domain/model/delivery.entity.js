export class Delivery {
  #id;
  #rentalId;
  #deliveredAt;
  #notes;
  constructor(props) {
    if (Number.isNaN(props.deliveredAt.getTime())) {
      throw new Error('Delivery date is invalid');
    }
    this.#id = props.id;
    this.#rentalId = props.rentalId;
    this.#deliveredAt = props.deliveredAt;
    this.#notes = props.notes ?? '';
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    this.#id = value;
  }
  get rentalId() {
    return this.#rentalId;
  }
  set rentalId(value) {
    this.#rentalId = value;
  }
  get deliveredAt() {
    return this.#deliveredAt;
  }
  set deliveredAt(value) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Delivery date is invalid');
    }
    this.#deliveredAt = value;
  }
  get notes() {
    return this.#notes;
  }
  set notes(value) {
    this.#notes = value;
  }
}
