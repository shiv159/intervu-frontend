import { computed, inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  email: string;
}

export interface AuthenticatedUser {
  userId: string;
  email: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  readonly accessToken = signal<string | null>(localStorage.getItem('intervu.auth.accessToken'));
  readonly refreshToken = signal<string | null>(localStorage.getItem('intervu.auth.refreshToken'));
  readonly user = signal<AuthenticatedUser | null>(this.readStoredUser());
  readonly isAuthenticated = computed(() => !!this.accessToken() && !!this.user());

  async login(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/login', { email, password }));
    this.store(response);
  }

  async register(email: string, password: string): Promise<void> {
    const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/register', { email, password }));
    this.store(response);
  }

  async refresh(): Promise<void> {
    const refreshToken = this.refreshToken();
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }
    const response = await firstValueFrom(this.http.post<AuthResponse>('/api/auth/refresh', { refreshToken }));
    this.store(response);
  }

  logout(): void {
    this.accessToken.set(null);
    this.refreshToken.set(null);
    this.user.set(null);
    localStorage.removeItem('intervu.auth.accessToken');
    localStorage.removeItem('intervu.auth.refreshToken');
    localStorage.removeItem('intervu.auth.user');
    localStorage.removeItem('intervu.session');
  }

  private store(response: AuthResponse): void {
    this.accessToken.set(response.accessToken);
    this.refreshToken.set(response.refreshToken);
    const user = { userId: response.userId, email: response.email };
    this.user.set(user);
    localStorage.setItem('intervu.auth.accessToken', response.accessToken);
    localStorage.setItem('intervu.auth.refreshToken', response.refreshToken);
    localStorage.setItem('intervu.auth.user', JSON.stringify(user));
  }

  private readStoredUser(): AuthenticatedUser | null {
    const raw = localStorage.getItem('intervu.auth.user');
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw) as AuthenticatedUser;
    } catch {
      return null;
    }
  }
}
