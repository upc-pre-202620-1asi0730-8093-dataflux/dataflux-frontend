export class DateRange {
  #startDate;
  #endDate;
  constructor(props) {
    if (Number.isNaN(props.startDate.getTime()) || Number.isNaN(props.endDate.getTime())) {
      throw new Error('Date range contains an invalid date');
    }
    if (props.startDate > props.endDate) {
      throw new Error('Start date must be before or equal to end date');
    }
    this.#startDate = props.startDate;
    this.#endDate = props.endDate;
  }
  get startDate() {
    return this.#startDate;
  }
  get endDate() {
    return this.#endDate;
  }
  overlaps(other) {
    return this.#startDate <= other.endDate && this.#endDate >= other.startDate;
  }
  contains(date) {
    return date >= this.#startDate && date <= this.#endDate;
  }
}
