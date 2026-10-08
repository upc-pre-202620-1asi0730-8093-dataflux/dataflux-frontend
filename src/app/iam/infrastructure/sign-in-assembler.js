export class SignInAssembler {
  toRequestFromCommand(command) {
    return {
      email: command.email,
      password: command.password,
    };
  }
  toResourceFromResponse(response) {
    return {
      id: response.id,
      email: response.email,
      role: response.role,
      status: response.status,
      token: response.token,
    };
  }
}
