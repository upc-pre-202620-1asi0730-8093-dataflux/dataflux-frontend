import { FetchClient, QueryParams, resolve } from '../../shared/infrastructure/services.js';
import { catchError, map, throwError } from 'rxjs';
import { environment } from '../../../environments/environment.js';

const usersEndpointUrl = `${environment.platformProviderApiBaseUrl}/users`;
export class FakeSignInApiEndpoint {
  #http = resolve(FetchClient);
  signIn(signInCommand) {
    const params = new QueryParams()
      .set('email', signInCommand.email)
      .set('password', signInCommand.password);
    return this.#http
      .get(usersEndpointUrl, {
        params,
      })
      .pipe(
        map((users) => {
          if (users.length === 0) {
            throw new Error('Invalid email or password');
          }
          const user = users[0];
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            status: user.status,
            token: String(user.id),
          };
        }),
        catchError((error) => throwError(() => new Error(`Failed to sign-in: ${error.message}`))),
      );
  }
}
