import { HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError, EMPTY } from 'rxjs';
import { catchError, switchMap, filter, take } from 'rxjs/operators';
import { TokenService } from '../Token/token.service'; // Import TokenService
import { inject } from '@angular/core';

let isRefreshing = false;
const refreshTokenSubject = new BehaviorSubject<string | null>(null);

export function authInterceptor(
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> {
  const tokenService = inject(TokenService); // Inject TokenService
  const accessToken = tokenService.getAccessToken();

  if (accessToken) {
    req = addTokenHeader(req, accessToken);
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) { 
        return handleAuthError(req, next, tokenService);
      }
      return throwError(() => error);
    })
  );
}

function addTokenHeader(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`
    }
  });
}

function handleAuthError(
  request: HttpRequest<any>,
  next: HttpHandlerFn,
  tokenService: TokenService
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return tokenService.refreshTokenAPI().pipe(
      switchMap((response: any) => {
        isRefreshing = false;
        const newAccessToken = response.data.accessToken;
        tokenService.setTokens(newAccessToken, response.data.refreshToken);
        refreshTokenSubject.next(newAccessToken);
        return next(addTokenHeader(request, newAccessToken));
      }),
      catchError((refreshError) => {
        isRefreshing = false;
        // Stop error propagation by returning an empty observable
        return EMPTY;
      })
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((newToken) => next(addTokenHeader(request, newToken!))),
      catchError(() => {
        // If refreshTokenSubject has encountered an error, logout the user instead of retrying
        return throwError(() => new Error('Session expired, logging out.'));
      })
    );
  }
}