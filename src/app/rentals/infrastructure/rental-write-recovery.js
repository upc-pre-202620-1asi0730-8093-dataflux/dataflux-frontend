import { catchError, of, switchMap, throwError } from 'rxjs';

// A failed response may follow a committed mock write. Only a successful read can
// distinguish that case from a rejected write; unavailable reads forbid rollback.
export function verifyRentalWrite(error, read, matches) {
  return read().pipe(
    catchError(() => throwError(() => Object.assign(
      new Error(`${error.message}. Recovery incomplete: write outcome could not be verified; inspect before retry`),
      { outcomeUnknown: true },
    ))),
    switchMap((actual) => matches(actual) ? of(actual) : throwError(() => error)),
  );
}

export function matchesRentalResource(actual, expected) {
  return actual != null && Object.entries(expected).every(([key, value]) =>
    key === 'id' && value === 0 ? true : actual[key] === value,
  );
}
