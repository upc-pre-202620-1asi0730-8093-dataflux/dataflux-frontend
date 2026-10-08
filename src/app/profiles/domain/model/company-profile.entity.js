export class CompanyProfile {
  #id;
  #userId;
  #firstName;
  #lastName;
  #contactEmail;
  #phoneNumber;
  #companyName;
  #address;
  constructor(props) {
    this.#id = props.id;
    this.#userId = props.userId;
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#contactEmail = props.contactEmail;
    this.#phoneNumber = props.phoneNumber;
    this.#companyName = props.companyName;
    this.#address = props.address;
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
  get firstName() {
    return this.#firstName;
  }
  set firstName(value) {
    this.#firstName = value;
  }
  get lastName() {
    return this.#lastName;
  }
  set lastName(value) {
    this.#lastName = value;
  }
  get contactEmail() {
    return this.#contactEmail;
  }
  set contactEmail(value) {
    this.#contactEmail = value;
  }
  get phoneNumber() {
    return this.#phoneNumber;
  }
  set phoneNumber(value) {
    this.#phoneNumber = value;
  }
  get companyName() {
    return this.#companyName;
  }
  set companyName(value) {
    this.#companyName = value;
  }
  get address() {
    return this.#address;
  }
  set address(value) {
    this.#address = value;
  }
}
