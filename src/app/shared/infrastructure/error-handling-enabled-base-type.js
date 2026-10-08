import { throwError } from 'rxjs';
export class ErrorHandlingEnabledBaseType {
  handleError(operation) {
    return (error) =>
      throwError(
        () =>
          new Error(
            `${operation}: ${error.status === 404 ? 'Resource not found' : error.error?.message || error.message || error.status || 'Unexpected error'}`,
          ),
      );
  }
}
