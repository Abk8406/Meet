import { HttpInterceptorFn } from '@angular/common/http';

export const burgerInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req);
};
