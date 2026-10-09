import { RentalRequestStatus } from './rental-request-status.enum.js';
export class RentalRequest {
  #id;
  #equipmentId;
  #constructionUserId;
  #rentalCompanyUserId;
  #period;
  #status;
  #createdAt;
  constructor(props) {
    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#constructionUserId = props.constructionUserId;
    this.#rentalCompanyUserId = props.rentalCompanyUserId;
    this.#period = props.period;
    this.#status = props.status ?? RentalRequestStatus.PENDING;
    this.#createdAt = props.createdAt ?? new Date();
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
  get createdAt() {
    return this.#createdAt;
  }
  set createdAt(value) {
    this.#createdAt = value;
  }
  get isPending() {
    return this.#status === RentalRequestStatus.PENDING;
  }
  approve() {
    this.#ensurePending();
    this.#status = RentalRequestStatus.APPROVED;
  }
  reject() {
    this.#ensurePending();
    this.#status = RentalRequestStatus.REJECTED;
  }
  #ensurePending() {
    if (!this.isPending) {
      throw new Error('Only pending rental requests can be updated');
    }
  }
}
