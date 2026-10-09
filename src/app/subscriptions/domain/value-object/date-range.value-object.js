function isValidDate(value) {
  return value instanceof Date && Number.isFinite(value.getTime());
}

export class DateRange {
  #startDate;
  #endDate;
  constructor(props = {}) {
    if (!isValidDate(props?.startDate) || !isValidDate(props?.endDate)) {
      throw new TypeError("Date range contains an invalid date");
    }
    if (props.startDate > props.endDate) {
      throw new RangeError("Start date must be before or equal to end date");
    }
    this.#startDate = new Date(props.startDate.getTime());
    this.#endDate = new Date(props.endDate.getTime());
  }
  get startDate() {
    return new Date(this.#startDate.getTime());
  }
  get endDate() {
    return new Date(this.#endDate.getTime());
  }
  overlaps(other) {
    const startDate = other?.startDate;
    const endDate = other?.endDate;
    return (
      isValidDate(startDate) &&
      isValidDate(endDate) &&
      startDate <= endDate &&
      this.#startDate <= endDate &&
      this.#endDate >= startDate
    );
  }
  contains(date) {
    return (
      isValidDate(date) && date >= this.#startDate && date <= this.#endDate
    );
  }
}
