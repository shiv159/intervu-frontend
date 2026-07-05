import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable, of, switchMap, tap } from 'rxjs';


import type {
  AnswerSubmissionResponse,
  CreateInterviewRequest,
  FeedbackResponse,
  InterviewSessionResponse,
  SessionEventResponse,
} from '../models/interview.models';

@Injectable({ providedIn: 'root' })
export class InterviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/interviews';
  private readonly tokenCache = new Map<string, string>();

  private getToken(userId: string): Observable<string> {
    if (this.tokenCache.has(userId)) {
      return of(this.tokenCache.get(userId)!);
    }
    return this.http.get<{token: string}>(`/api/auth/dev-token?userId=${userId}`).pipe(
      tap(res => this.tokenCache.set(userId, res.token)),
      switchMap(res => of(res.token))
    );
  }

  createInterview(userId: string, request: CreateInterviewRequest): Observable<InterviewSessionResponse> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.post<InterviewSessionResponse>(this.baseUrl, request, {
        headers: this.authHeaders(token),
      }))
    );
  }

  getInterview(userId: string, sessionId: string): Observable<InterviewSessionResponse> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.get<InterviewSessionResponse>(`${this.baseUrl}/${sessionId}`, {
        headers: this.authHeaders(token),
      }))
    );
  }

  submitAnswer(
    userId: string,
    sessionId: string,
    idempotencyKey: string,
    answer: string,
  ): Observable<AnswerSubmissionResponse> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.post<AnswerSubmissionResponse>(`${this.baseUrl}/${sessionId}/interactions`, { answer }, {
        headers: this.authHeaders(token).set('Idempotency-Key', idempotencyKey),
      }))
    );
  }

  nextQuestion(userId: string, sessionId: string): Observable<InterviewSessionResponse> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.post<InterviewSessionResponse>(`${this.baseUrl}/${sessionId}/next`, {}, {
        headers: this.authHeaders(token),
      }))
    );
  }

  getFeedback(userId: string, sessionId: string): Observable<FeedbackResponse> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.get<FeedbackResponse>(`${this.baseUrl}/${sessionId}/feedback`, {
        headers: this.authHeaders(token),
      }))
    );
  }

  getEvents(userId: string, sessionId: string, afterVersion: number): Observable<SessionEventResponse[]> {
    return this.getToken(userId).pipe(
      switchMap(token => this.http.get<SessionEventResponse[]>(`${this.baseUrl}/${sessionId}/events`, {
        headers: this.authHeaders(token),
        params: {
          after: afterVersion,
        },
      }))
    );
  }

  private authHeaders(token: string): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
    });
  }
}
