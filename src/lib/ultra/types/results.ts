export type Result<T, E = Error> = { success: true; data: T } | { success: false; error: E };

export const Result = {
  ok: <T>(data: T): Result<T> => ({ success: true, data }),
  err: <E>(error: E): Result<never, E> => ({ success: false, error }),

  map: <T, U>(result: Result<T>, fn: (data: T) => U): Result<U> => {
    if (result.success) {
      return Result.ok(fn(result.data));
    }
    return result as Result<never>;
  },

  flatMap: <T, U>(result: Result<T>, fn: (data: T) => Result<U>): Result<U> => {
    if (result.success) {
      return fn(result.data);
    }
    return result as Result<never>;
  },

  getOrElse: <T>(result: Result<T>, defaultValue: T): T => {
    if (result.success) {
      return result.data;
    }
    return defaultValue;
  },
};
