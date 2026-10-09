import { MaintenanceStatus } from './maintenance-status.enum.js';
export class Maintenance {
  #id;
  #equipmentId;
  #performedAt;
  #type;
  #status;
  constructor(props) {
    if (props.equipmentId <= 0) {
      throw new Error('Equipment id is invalid');
    }
    if (Number.isNaN(props.performedAt.getTime())) {
      throw new Error('Maintenance date is invalid');
    }
    if (!props.type.trim()) {
      throw new Error('Maintenance type is required');
    }
    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#performedAt = props.performedAt;
    this.#type = props.type.trim();
    this.#status = props.status ?? MaintenanceStatus.COMPLETED;
  }
  static schedule(props, referenceDate = new Date()) {
    if (Number.isNaN(props.scheduledAt.getTime())) {
      throw new Error('Scheduled maintenance date is invalid');
    }
    if (Number.isNaN(referenceDate.getTime())) {
      throw new Error('Reference date is invalid');
    }
    const startOfToday = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    if (props.scheduledAt.getTime() < startOfToday.getTime()) {
      throw new Error('Scheduled maintenance date cannot be in the past');
    }
    return new Maintenance({
      id: props.id,
      equipmentId: props.equipmentId,
      performedAt: props.scheduledAt,
      type: props.type,
      status: MaintenanceStatus.SCHEDULED,
    });
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
    if (value <= 0) {
      throw new Error('Equipment id is invalid');
    }
    this.#equipmentId = value;
  }
  get performedAt() {
    return this.#performedAt;
  }
  set performedAt(value) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Maintenance date is invalid');
    }
    this.#performedAt = value;
  }
  get type() {
    return this.#type;
  }
  set type(value) {
    if (!value.trim()) {
      throw new Error('Maintenance type is required');
    }
    this.#type = value.trim();
  }
  get status() {
    return this.#status;
  }
  set status(value) {
    this.#status = value;
  }
}
