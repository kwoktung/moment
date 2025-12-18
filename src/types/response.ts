export type PaginationType<T> = {
  items: T[];
  total: number;
};

export type HttpResponseType<T> = {
  data: T;
  success: boolean;
  message?: string;
};
