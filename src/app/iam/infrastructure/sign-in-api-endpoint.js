import { FetchClient, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map } from 'rxjs';
import { environment } from '../../../environments/environment.js';

import { ErrorHandlingEnabledBaseType } from '../../shared/infrastructure/error-handling-enabled-base-type.js';
import { SignInAssembler } from './sign-in-assembler.js';
const signInApiEndpointUrl = `${environment.platformProviderApiBaseUrl}${environment.platformProviderSignInEndpointPath}`;
export class SignInApiEndpoint extends ErrorHandlingEnabledBaseType {
  #http = resolve(FetchClient);
  #assembler = new SignInAssembler();
  signIn(signInCommand) {
    const signInRequest = this.#assembler.toRequestFromCommand(signInCommand);
    return this.#http.post(signInApiEndpointUrl, signInRequest).pipe(
      map((response) => this.#assembler.toResourceFromResponse(response)),
      catchError(this.handleError('Failed to sign-in')),
    );
  }
}
