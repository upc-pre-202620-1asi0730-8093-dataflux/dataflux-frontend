import { EquipmentStatus } from './equipment-status.enum.js';
export class Equipment {
  #id;
  #userId;
  #code;
  #name;
  #description;
  #categoryId;
  #category;
  #location;
  #rentalRate;
  #status;
  #availabilityBlocks;
  constructor(props) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#code = props.code;
    this.#name = props.name;
    this.#description = props.description;
    this.#categoryId = props.categoryId;
    this.#category = props.category ?? null;
    this.#location = props.location;
    this.#rentalRate = props.rentalRate;
    this.#status = props.status ?? EquipmentStatus.AVAILABLE;
    this.#availabilityBlocks = props.availabilityBlocks ?? [];
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
  get code() {
    return this.#code;
  }
  set code(value) {
    this.#code = value;
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
  get categoryId() {
    return this.#categoryId;
  }
  set categoryId(value) {
    this.#categoryId = value;
  }
  get category() {
    return this.#category;
  }
  set category(value) {
    this.#category = value;
  }
  get location() {
    return this.#location;
  }
  set location(value) {
    this.#location = value;
  }
  get rentalRate() {
    return this.#rentalRate;
  }
  set rentalRate(value) {
    this.#rentalRate = value;
  }
  get status() {
    return this.#status;
  }
  set status(value) {
    this.#status = value;
  }
  get availabilityBlocks() {
    return this.#availabilityBlocks;
  }
  set availabilityBlocks(value) {
    this.#availabilityBlocks = value;
  }
  isAvailableFor(period) {
    if (this.#status !== EquipmentStatus.AVAILABLE) {
      return false;
    }
    return !this.#availabilityBlocks.some((block) => block.overlaps(period));
  }
  isReservedOn(date) {
    return this.#availabilityBlocks.some((block) => block.period.contains(date));
  }
}
