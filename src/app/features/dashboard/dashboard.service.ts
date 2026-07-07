import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, switchMap, tap } from 'rxjs';
import type {
  DashboardSessionSummary,
  SessionFeedbackResponse,
} from '../../core/models/interview.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);
  private readonly tokenCache = new Map<string, string>();

  private getToken(userId: string): Observable<string> {
    if (this.tokenCache.has(userId)) {
      return of(this.tokenCache.get(userId)!);
    }
    return this.http
      .get<{ token: string }>(`/api/auth/dev-token?userId=${userId}`)
      .pipe(
        tap((res) => this.tokenCache.set(userId, res.token)),
        switchMap((res) => of(res.token)),
      );
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  loadDashboard(
    userId: string,
    page = 0,
    size = 20,
  ): Observable<DashboardSessionSummary[]> {
    return this.getToken(userId).pipe(
      switchMap((token) =>
        this.http.get<DashboardSessionSummary[]>(
          `/api/dashboard/sessions?page=${page}&size=${size}`,
          { headers: this.authHeaders(token) },
        ),
      ),
    );
  }

  loadFeedback(
    userId: string,
    sessionId: string,
  ): Observable<SessionFeedbackResponse> {
    return this.getToken(userId).pipe(
      switchMap((token) =>
        this.http.get<SessionFeedbackResponse>(
          `/api/dashboard/sessions/${sessionId}/feedback`,
          { headers: this.authHeaders(token) },
        ),
      ),
    );
  }

  deleteSession(userId: string, sessionId: string): Observable<void> {
    return this.getToken(userId).pipe(
      switchMap((token) =>
        this.http.delete<void>(`/api/dashboard/sessions/${sessionId}`, {
          headers: this.authHeaders(token),
        }),
      ),
    );
  }
}