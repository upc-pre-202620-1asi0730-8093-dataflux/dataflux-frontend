export class SignUpCommand {
  #firstName;
  #lastName;
  #email;
  #password;
  #companyName;
  #role;
  constructor(props) {
    this.#firstName = props.firstName;
    this.#lastName = props.lastName;
    this.#email = props.email;
    this.#password = props.password;
    this.#companyName = props.companyName;
    this.#role = props.role;
  }
  get firstName() {
    return this.#firstName;
  }
  get lastName() {
    return this.#lastName;
  }
  get email() {
    return this.#email;
  }
  get password() {
    return this.#password;
  }
  get companyName() {
    return this.#companyName;
  }
  get role() {
    return this.#role;
  }
}
