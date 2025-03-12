import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, EMPTY, Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { User } from '../../models/user';
import { MatSnackBar } from '@angular/material/snack-bar';
import { throwError } from 'rxjs';
import { TokenService } from '../Token/token.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  private userSubject = new BehaviorSubject<User | null>(null);

  isLoggedIn$ = this.isLoggedInSubject.asObservable();
  user$ = this.userSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private snackBar: MatSnackBar,
    private tokenService: TokenService // Inject TokenService
  ) {
    if (this.tokenService.getAccessToken()) {
      this.isLoggedInSubject.next(true);
      this.loadUserProfile();
    }
  }

  private showToast(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['error-snackbar']
    });
  }

  login(email: string, password: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, { email, password }).pipe(
      tap((response: any) => {
        this.tokenService.setTokens(response.data.accessToken, response.data.refreshToken);
        this.isLoggedInSubject.next(true);
        this.loadUserProfile();
        this.router.navigate(['/app']);
      }),
      catchError((error) => {
        const errorMessage = error.error?.message || 'Login failed. Please try again.';
        this.showToast(errorMessage);
        console.error('Login error:', error);
        return throwError(() => error);
      })
    );
  }

  register(name: string, email: string, password: string, role: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/signup`, { name, email, password, role }).pipe(
      tap(() => this.router.navigate(['/auth/login'])),
      catchError((error) => {
        const errorMessage = error.error?.message || 'Registration failed. Please try again.';
        this.showToast(errorMessage);
        console.error('Registration error:', error);
        return throwError(() => error);
      })
    );
  }

  // logout() {
  //   this.tokenService.clearTokens();
  //   this.userSubject.next(null);
  //   this.isLoggedInSubject.next(false);
  //   this.router.navigate(['/auth/login']); 
  // }

  logout(): void {
    this.http.post(`${this.apiUrl}/logout`, {}).pipe(
      tap(() => {
        this.tokenService.clearTokens(); // Clear tokens from storage
        this.userSubject.next(null); // Reset user state
        this.isLoggedInSubject.next(false); // Update authentication status
        this.router.navigate(['/auth/login']); // Redirect to login page
      }),
      catchError((error) => {
        const errorMessage = error.error?.message || 'Logout failed. Please try again.';
        this.showToast(errorMessage);
        // console.error('Logout error:', error);
        return EMPTY; // Stop further execution
      })
    ).subscribe();
  }
  

  getUserProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/me`).pipe( // Token added by interceptor
      catchError((error) => {
        const errorMessage = error.error?.message || 'Failed to load profile. Please try again.';
        this.showToast(errorMessage);
        console.error('Get profile error:', error);
        return throwError(() => error);
      })
    );
  }

  updateUser(id: string, name: string, email: string, password: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}`, { name, email, password }).pipe(
      tap(() => this.showToast('Profile updated successfully')),
      catchError((error) => {
        const errorMessage = error.error?.message || 'Failed to update profile. Please try again.';
        this.showToast(errorMessage);
        console.error('Update profile error:', error);
        return throwError(() => error);
      })
    );
  }

  public loadUserProfile() {
    this.getUserProfile().subscribe({
      next: (user) => {
        this.userSubject.next(user.data);
      },
      error: () => {
        // Error handled in getUserProfile
      }
    });
  }

  public isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  public getCurrentUser(): User | null {
    return this.userSubject.value;
  }

  // Delegate token methods to TokenService
  getAccessToken(): string | null {
    return this.tokenService.getAccessToken();
  }

  setTokens(accessToken: string, refreshToken: string): void {
    this.tokenService.setTokens(accessToken, refreshToken);
  }

  refreshToken(): Observable<any> {
    return this.tokenService.refreshTokenAPI();
  }
}