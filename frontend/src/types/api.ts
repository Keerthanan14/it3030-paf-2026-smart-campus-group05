export interface ApiErrorResponse {
  message?: string;
  error?: string;
  status?: number;
  timestamp?: string;
  path?: string;
}

export interface ApiSuccessResponse<T> {
  data: T;
  message?: string;
}
