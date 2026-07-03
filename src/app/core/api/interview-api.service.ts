import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';

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

  createInterview(userId: string, request: CreateInterviewRequest): Observable<InterviewSessionResponse> {
    return this.http.post<InterviewSessionResponse>(this.baseUrl, request, {
      headers: this.userHeaders(userId),
    });
  }

  getInterview(userId: string, sessionId: string): Observable<InterviewSessionResponse> {
    return this.http.get<InterviewSessionResponse>(`${this.baseUrl}/${sessionId}`, {
      headers: this.userHeaders(userId),
    });
  }

  submitAnswer(
    userId: string,
    sessionId: string,
    idempotencyKey: string,
    answer: string,
  ): Observable<AnswerSubmissionResponse> {
    return this.http.post<AnswerSubmissionResponse>(`${this.baseUrl}/${sessionId}/interactions`, { answer }, {
      headers: this.userHeaders(userId).set('Idempotency-Key', idempotencyKey),
    });
  }

  getFeedback(userId: string, sessionId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.baseUrl}/${sessionId}/feedback`, {
      headers: this.userHeaders(userId),
    });
  }

  getEvents(userId: string, sessionId: string, afterVersion: number): Observable<SessionEventResponse[]> {
    return this.http.get<SessionEventResponse[]>(`${this.baseUrl}/${sessionId}/events`, {
      headers: this.userHeaders(userId),
      params: {
        after: afterVersion,
      },
    });
  }

  private userHeaders(userId: string): HttpHeaders {
    return new HttpHeaders({
      'X-User-Id': userId,
    });
  }
}
