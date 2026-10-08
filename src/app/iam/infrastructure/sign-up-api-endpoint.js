import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';
import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';

import { SignUpAssembler } from './sign-up-assembler.js';
const signUpApiEndpointUrl =
  `${environment.platformProviderApiBaseUrl}` + `${environment.platformProviderSignUpEndpointPath}`;
export class SignUpApiEndpoint extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #assembler = new SignUpAssembler();
  signUp(signUpCommand) {
    const signUpRequest = this.#assembler.toRequestFromCommand(signUpCommand);
    return this.#http.post(signUpApiEndpointUrl, signUpRequest).pipe(
      map((response) => this.#assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-up')),
    );
  }
}
