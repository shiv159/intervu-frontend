import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  DashboardSessionSummary,
  SessionFeedbackResponse,
} from '../../core/models/interview.models';

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly http = inject(HttpClient);

  loadDashboard(
    page = 0,
    size = 20,
  ): Observable<DashboardSessionSummary[]> {
    return this.http.get<DashboardSessionSummary[]>(
      `/api/dashboard/sessions?page=${page}&size=${size}`,
    );
  }

  loadFeedback(sessionId: string): Observable<SessionFeedbackResponse> {
    return this.http.get<SessionFeedbackResponse>(
      `/api/dashboard/sessions/${sessionId}/feedback`,
    );
  }

  deleteSession(sessionId: string): Observable<void> {
    return this.http.delete<void>(`/api/dashboard/sessions/${sessionId}`);
  }
}
