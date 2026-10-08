import { RentalStatus } from './rental-status.enum.js';
export class Rental {
  #id;
  #equipmentId;
  #constructionUserId;
  #rentalCompanyUserId;
  #period;
  #status;
  constructor(props) {
    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#constructionUserId = props.constructionUserId;
    this.#rentalCompanyUserId = props.rentalCompanyUserId;
    this.#period = props.period;
    this.#status = props.status ?? RentalStatus.CONFIRMED;
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    this.#id = value;
  }
  get equipmentId() {
    return this.#equipmentId;
  }
  set equipmentId(value) {
    this.#equipmentId = value;
  }
  get constructionUserId() {
    return this.#constructionUserId;
  }
  set constructionUserId(value) {
    this.#constructionUserId = value;
  }
  get rentalCompanyUserId() {
    return this.#rentalCompanyUserId;
  }
  set rentalCompanyUserId(value) {
    this.#rentalCompanyUserId = value;
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
  get isConfirmed() {
    return this.#status === RentalStatus.CONFIRMED;
  }
  get isActive() {
    return this.#status === RentalStatus.ACTIVE;
  }
  get isCompleted() {
    return this.#status === RentalStatus.COMPLETED;
  }
  registerDelivery() {
    if (!this.isConfirmed) {
      throw new Error('Only confirmed rentals can register a delivery');
    }
    this.#status = RentalStatus.ACTIVE;
  }
  registerReturn() {
    if (!this.isActive) {
      throw new Error('Only active rentals can register a return');
    }
    this.#status = RentalStatus.COMPLETED;
  }
}
