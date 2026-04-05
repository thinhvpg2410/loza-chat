export type ApiResponse<T> = { data: T; message: string };

export function apiOk<T>(data: T, message = 'Success'): ApiResponse<T> {
  return { data, message };
}
