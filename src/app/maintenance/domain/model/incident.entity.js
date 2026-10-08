import { IncidentStatus } from './incident-status.enum.js';
export class Incident {
  #id;
  #equipmentId;
  #description;
  #reportedAt;
  #blocksRental;
  #status;
  #resolvedAt;
  constructor(props) {
    if (!Number.isInteger(props.id) || props.id < 0) {
      throw new Error('Incident id is invalid');
    }
    if (!Number.isInteger(props.equipmentId) || props.equipmentId <= 0) {
      throw new Error('Equipment id is invalid');
    }
    if (!props.description.trim()) {
      throw new Error('Incident description is required');
    }
    if (Number.isNaN(props.reportedAt.getTime())) {
      throw new Error('Incident date is invalid');
    }
    if (props.blocksRental !== undefined && typeof props.blocksRental !== 'boolean') {
      throw new Error('Incident rental restriction is invalid');
    }
    const status = props.status ?? IncidentStatus.OPEN;
    if (!Object.values(IncidentStatus).includes(status)) {
      throw new Error('Incident status is invalid');
    }
    const resolvedAt = props.resolvedAt ?? null;
    if (resolvedAt !== null && Number.isNaN(resolvedAt.getTime())) {
      throw new Error('Incident resolution date is invalid');
    }
    if (status === IncidentStatus.RESOLVED && resolvedAt === null) {
      throw new Error('Resolved incident requires a resolution date');
    }
    if (status === IncidentStatus.OPEN && resolvedAt !== null) {
      throw new Error('Open incident cannot have a resolution date');
    }
    this.#id = props.id;
    this.#equipmentId = props.equipmentId;
    this.#description = props.description.trim();
    this.#reportedAt = new Date(props.reportedAt);
    this.#blocksRental = props.blocksRental ?? false;
    this.#status = status;
    this.#resolvedAt = resolvedAt ? new Date(resolvedAt) : null;
  }
  static report(props) {
    return new Incident({
      id: 0,
      equipmentId: props.equipmentId,
      description: props.description,
      reportedAt: new Date(),
      blocksRental: props.blocksRental ?? false,
      status: IncidentStatus.OPEN,
      resolvedAt: null,
    });
  }
  requireRentalRestriction() {
    if (this.#status !== IncidentStatus.OPEN) {
      throw new Error('Only open incidents can require rental restriction');
    }
    if (this.#blocksRental) {
      throw new Error('Incident already blocks rental');
    }
    this.#blocksRental = true;
  }
  resolve(resolvedAt = new Date()) {
    if (this.#status === IncidentStatus.RESOLVED) {
      throw new Error('Incident is already resolved');
    }
    if (Number.isNaN(resolvedAt.getTime())) {
      throw new Error('Incident resolution date is invalid');
    }
    if (resolvedAt.getTime() < this.#reportedAt.getTime()) {
      throw new Error('Resolution cannot precede incident report');
    }
    this.#status = IncidentStatus.RESOLVED;
    this.#resolvedAt = new Date(resolvedAt);
  }
  get id() {
    return this.#id;
  }
  set id(value) {
    if (!Number.isInteger(value) || value < 0) {
      throw new Error('Incident id is invalid');
    }
    this.#id = value;
  }
  get equipmentId() {
    return this.#equipmentId;
  }
  set equipmentId(value) {
    if (!Number.isInteger(value) || value <= 0) {
      throw new Error('Equipment id is invalid');
    }
    this.#equipmentId = value;
  }
  get description() {
    return this.#description;
  }
  set description(value) {
    if (!value.trim()) {
      throw new Error('Incident description is required');
    }
    this.#description = value.trim();
  }
  get reportedAt() {
    return new Date(this.#reportedAt);
  }
  set reportedAt(value) {
    if (Number.isNaN(value.getTime())) {
      throw new Error('Incident date is invalid');
    }
    this.#reportedAt = new Date(value);
  }
  get blocksRental() {
    return this.#blocksRental;
  }
  get status() {
    return this.#status;
  }
  get resolvedAt() {
    return this.#resolvedAt ? new Date(this.#resolvedAt) : null;
  }
}
