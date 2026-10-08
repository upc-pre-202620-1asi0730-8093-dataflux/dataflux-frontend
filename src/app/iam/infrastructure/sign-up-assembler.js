export class SignUpAssembler {
  toRequestFromCommand(command) {
    return {
      firstName: command.firstName,
      lastName: command.lastName,
      email: command.email,
      password: command.password,
      companyName: command.companyName,
      role: command.role,
      status: 'active',
    };
  }
  toResourceFromResponse(response) {
    return {
      id: response.id,
      firstName: response.firstName,
      lastName: response.lastName,
      email: response.email,
      companyName: response.companyName,
      role: response.role,
      status: response.status,
    };
  }
}
