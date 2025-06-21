import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { catchError, Observable, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service'; // Assuming you have a service to handle token refresh

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = sessionStorage.getItem('accessToken');

    // Clone the request and add the Authorization header
    let modifiedReq = req;
    if (token) {
      modifiedReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next.handle(modifiedReq).pipe(
      catchError((error) => {
        if (error.status === 401) {
          // If the token has expired or is invalid, attempt to refresh the token
          return this.authService.refreshToken().pipe(
            switchMap((newAccessToken) => {
              modifiedReq = req.clone({
                setHeaders: {
                  Authorization: `Bearer ${newAccessToken}`,
                },
              });
              return next.handle(modifiedReq);
            })
          );
        }
        return throwError(() => error);
      })
    );
  }
}
