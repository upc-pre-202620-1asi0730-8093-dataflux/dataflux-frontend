export class Address {
  #street;
  #district;
  #city;
  #country;
  #latitude;
  #longitude;
  constructor(props) {
    this.#street = props.street;
    this.#district = props.district;
    this.#city = props.city;
    this.#country = props.country;
    this.#latitude = props.latitude;
    this.#longitude = props.longitude;
  }
  get street() {
    return this.#street;
  }
  get district() {
    return this.#district;
  }
  get city() {
    return this.#city;
  }
  get country() {
    return this.#country;
  }
  get latitude() {
    return this.#latitude;
  }
  get longitude() {
    return this.#longitude;
  }
}
