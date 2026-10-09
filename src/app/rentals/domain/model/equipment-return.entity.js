export class EquipmentReturn {
  #id;
  #rentalId;
  #returnedAt;
  #notes;
  #maintenanceRequired;
  constructor(props) {
    if (Number.isNaN(props.returnedAt.getTime())) {
      throw new Error('Return date is invalid');
    }
    this.#id = props.id;
    this.#rentalId = props.rentalId;
    this.#returnedAt = props.returnedAt;
    this.#notes = props.notes ?? '';
    this.#maintenanceRequired = props.maintenanceRequired ?? false;
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
  get returnedAt() {
    return this.#returnedAt;
  }
  set returnedAt(value) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Return date is invalid');
    }
    this.#returnedAt = value;
  }
  get notes() {
    return this.#notes;
  }
  set notes(value) {
    this.#notes = value;
  }
  get maintenanceRequired() {
    return this.#maintenanceRequired;
  }
  set maintenanceRequired(value) {
    this.#maintenanceRequired = value;
  }
  requiresMaintenance() {
    return this.#maintenanceRequired;
  }
}
