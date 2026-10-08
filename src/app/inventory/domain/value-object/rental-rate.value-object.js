export class RentalRate {
  #dailyRate;
  #weeklyRate;
  constructor(props) {
    if (props.dailyRate <= 0) {
      throw new Error('Daily rate must be greater than zero');
    }
    if (props.weeklyRate <= 0) {
      throw new Error('Weekly rate must be greater than zero');
    }
    this.#dailyRate = props.dailyRate;
    this.#weeklyRate = props.weeklyRate;
  }
  get dailyRate() {
    return this.#dailyRate;
  }
  get weeklyRate() {
    return this.#weeklyRate;
  }
}
