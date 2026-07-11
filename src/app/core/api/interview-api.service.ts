import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';


import type {
  AnswerSubmissionResponse,
  CreateInterviewRequest,
  FeedbackResponse,
  InterviewSessionResponse,
  JdExtractResponse,
  ResumeExtractResponse,
  SessionEventResponse,
} from '../models/interview.models';

@Injectable({ providedIn: 'root' })
export class InterviewApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/interviews';

  createInterview(request: CreateInterviewRequest): Observable<InterviewSessionResponse> {
    return this.http.post<InterviewSessionResponse>(this.baseUrl, request);
  }

  getInterview(sessionId: string): Observable<InterviewSessionResponse> {
    return this.http.get<InterviewSessionResponse>(`${this.baseUrl}/${sessionId}`);
  }

  submitAnswer(
    sessionId: string,
    idempotencyKey: string,
    answer: string,
  ): Observable<AnswerSubmissionResponse> {
    return this.http.post<AnswerSubmissionResponse>(`${this.baseUrl}/${sessionId}/interactions`, { answer }, {
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    });
  }

  nextQuestion(sessionId: string): Observable<InterviewSessionResponse> {
    return this.http.post<InterviewSessionResponse>(`${this.baseUrl}/${sessionId}/next`, {});
  }

  getFeedback(sessionId: string): Observable<FeedbackResponse> {
    return this.http.get<FeedbackResponse>(`${this.baseUrl}/${sessionId}/feedback`);
  }

  getEvents(sessionId: string, afterVersion: number): Observable<SessionEventResponse[]> {
    return this.http.get<SessionEventResponse[]>(`${this.baseUrl}/${sessionId}/events`, {
      params: {
        after: afterVersion,
      },
    });
  }

  uploadResume(file: File): Observable<ResumeExtractResponse> {
    const form = new FormData();
    form.append('file', file);
    return this.http.post<ResumeExtractResponse>('/api/resumes', form);
  }

  createJd(sourceText: string): Observable<JdExtractResponse> {
    return this.http.post<JdExtractResponse>('/api/jds', { sourceText });
  }

  getLatestResume(): Observable<ResumeExtractResponse> {
    return this.http.get<ResumeExtractResponse>('/api/resumes/latest');
  }

  getLatestJd(): Observable<JdExtractResponse> {
    return this.http.get<JdExtractResponse>('/api/jds/latest');
  }
}
