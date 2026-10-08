export class SignInCommand {
  #email;
  #password;
  constructor(props) {
    this.#email = props.email;
    this.#password = props.password;
  }
  get email() {
    return this.#email;
  }
  set email(value) {
    this.#email = value;
  }
  get password() {
    return this.#password;
  }
  set password(value) {
    this.#password = value;
  }
}
