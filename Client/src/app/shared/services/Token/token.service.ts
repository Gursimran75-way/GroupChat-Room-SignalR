import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { EMPTY, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  private apiUrl = environment.apiUrl;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
  ) {
    this.accessToken = localStorage.getItem('accessToken');
    this.refreshToken = localStorage.getItem('refreshToken');
  }

  getAccessToken(): string | null {
    return this.accessToken;
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.accessToken = accessToken;
    this.refreshToken = refreshToken;
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  // clearTokensRefresh(): void {
  //   console.log("3333333333")
  //   this.accessToken = null;
  //   this.refreshToken = null;
  //   localStorage.removeItem('accessToken');
  //   localStorage.removeItem('refreshToken');
  //   this.router.navigate(['/auth/login']);
  //   this.showToast('Session expired. Please log in again.');
  //   console.log("444444444444444444444")
  // }

  refreshTokenAPI(): Observable<any> {
    return this.http.post(`${this.apiUrl}/refresh-token`, { refreshToken: this.refreshToken }).pipe(
      tap((response: any) => {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
      }),
      catchError((error) => {
        console.log("11111111111111111111111")
        this.showToast('Session expired. Please log in again.');
        this.clearTokens();
        this.router.navigate(['/auth/login']);// ! not working as i am not able to change the isLoggedInSubject in auth.service due to circular dependency
        return EMPTY;
      })
    );
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }
}