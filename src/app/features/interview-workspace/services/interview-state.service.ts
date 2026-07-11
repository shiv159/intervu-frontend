import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

import { InterviewApiService } from '../../../core/api/interview-api.service';
import type {
  CreateInterviewRequest,
  FeedbackResponse,
  InterviewSessionResponse,
  QuestionPayload,
  SessionEventResponse,
} from '../../../core/models/interview.models';

export type SetupSnapshot = {
  sessionId: string;
};

@Injectable({ providedIn: 'root' })
export class InterviewStateService {
  private readonly api = inject(InterviewApiService);

  // Writable Signals
  readonly session = signal<InterviewSessionResponse | null>(null);
  readonly feedback = signal<FeedbackResponse | null>(null);
  readonly events = signal<SessionEventResponse[]>([]);
  readonly errorMessage = signal<string>('');
  
  readonly isBusy = signal(false);
  readonly isSubmitting = signal(false);
  readonly isRestoring = signal(false);
  readonly isSyncingEvents = signal(false);

  private lastEventVersion = 0;
  private currentIdempotencyKey = crypto.randomUUID();
  private pollTimer: number | null = null;

  // Computed Signals
  readonly question = computed<QuestionPayload | null>(() => this.session()?.currentQuestion ?? null);
  readonly hasSession = computed<boolean>(() => this.session() !== null);
  readonly lastEvaluation = computed(() => this.session()?.lastEvaluation ?? null);
  
  readonly statusLabel = computed<string>(() => {
    if (this.isSubmitting()) return 'Scoring answer...';
    if (this.isBusy() || this.isRestoring()) return 'Loading interview...';
    const s = this.session();
    if (s) {
      if (s.state === 'WAITING_EVALUATION') return 'Evaluating answer…';
      return s.state;
    }
    return 'Ready to start';
  });

  async startInterview(request: CreateInterviewRequest): Promise<void> {
    this.errorMessage.set('');
    this.isBusy.set(true);

    try {
      const response = await firstValueFrom(this.api.createInterview(request));
      
      this.session.set(response);
      this.feedback.set(response.lastEvaluation ? this.feedbackFromEvaluation(response.sessionId, response.lastEvaluation) : null);
      this.currentIdempotencyKey = crypto.randomUUID();
      this.saveSessionSnapshot(response.sessionId);
      
      await this.syncEvents(true);
      this.startPolling();
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isBusy.set(false);
    }
  }

  async restoreSession(sessionId: string): Promise<void> {
    this.isRestoring.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(this.api.getInterview(sessionId));
      this.session.set(response);
      this.feedback.set(response.lastEvaluation ? this.feedbackFromEvaluation(response.sessionId, response.lastEvaluation) : null);
      this.saveSessionSnapshot(sessionId);
      
      await this.syncEvents(true);
      this.startPolling();
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
      this.clearSessionSnapshot();
    } finally {
      this.isRestoring.set(false);
    }
  }

  async submitAnswer(answer: string): Promise<void> {
    const s = this.session();
    if (!s) return;

    this.isSubmitting.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.api.submitAnswer(s.sessionId, this.currentIdempotencyKey, answer),
      );

      this.session.set(response.session);
      if (response.evaluation) {
        this.feedback.set(this.feedbackFromEvaluation(response.session.sessionId, response.evaluation));
      }
      this.currentIdempotencyKey = crypto.randomUUID();
      this.saveSessionSnapshot(response.session.sessionId);
      
      await this.syncEvents();
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isSubmitting.set(false);
    }
  }

  async acknowledgeFeedback(): Promise<void> {
    const s = this.session();
    if (!s) return;

    this.isBusy.set(true);
    this.errorMessage.set('');

    try {
      const response = await firstValueFrom(
        this.api.nextQuestion(s.sessionId),
      );

      this.session.set(response);
      this.feedback.set(response.lastEvaluation ? this.feedbackFromEvaluation(response.sessionId, response.lastEvaluation) : null);
      
      await this.syncEvents();
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isBusy.set(false);
    }
  }

  resetInterview(): void {
    this.session.set(null);
    this.feedback.set(null);
    this.events.set([]);
    this.currentIdempotencyKey = crypto.randomUUID();
    this.lastEventVersion = 0;
    this.stopPolling();
    this.clearSessionSnapshot();
  }

  loadSessionSnapshot(): SetupSnapshot | null {
    const raw = localStorage.getItem('intervu.session');
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SetupSnapshot;
    } catch {
      return null;
    }
  }

  private async syncEvents(reset = false): Promise<void> {
    const s = this.session();
    if (!s || this.isSyncingEvents()) return;

    this.isSyncingEvents.set(true);

    try {
      const fetchedEvents = await firstValueFrom(
        this.api.getEvents(s.sessionId, reset ? 0 : this.lastEventVersion),
      );

      if (reset) {
        this.events.set([]);
        this.lastEventVersion = 0;
      }

      if (fetchedEvents.length > 0) {
        const updatedEvents = [...this.events(), ...fetchedEvents].slice(-8);
        this.events.set(updatedEvents);
        this.lastEventVersion = fetchedEvents.at(-1)?.eventVersion ?? this.lastEventVersion;
        await this.refreshSessionAfterEvents(fetchedEvents);
      }
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    } finally {
      this.isSyncingEvents.set(false);
    }
  }

  private startPolling(): void {
    this.stopPolling();
    this.pollTimer = window.setInterval(() => {
      void this.syncEvents();
    }, 4000);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      window.clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  private async refreshSessionAfterEvents(fetchedEvents: SessionEventResponse[]): Promise<void> {
    const shouldReload = fetchedEvents.some((event) =>
      ['EVALUATION_COMPLETED', 'LIVE_SCORE_UPDATED', 'NEXT_QUESTION_READY', 'INTERVIEW_COMPLETED'].includes(event.eventType),
    );

    const s = this.session();
    if (!shouldReload || !s) return;

    try {
      const [newSession, newFeedback] = await Promise.all([
        firstValueFrom(this.api.getInterview(s.sessionId)),
        firstValueFrom(this.api.getFeedback(s.sessionId)),
      ]);

      this.session.set(newSession);
      this.feedback.set(newFeedback);
    } catch (error) {
      this.errorMessage.set(this.formatError(error));
    }
  }

  private feedbackFromEvaluation(sessionId: string, evaluation: NonNullable<InterviewSessionResponse['lastEvaluation']>): FeedbackResponse {
    return {
      sessionId,
      summary: `Current score: ${evaluation.totalScore}. ${evaluation.followUpQuestion ? 'A follow-up is ready.' : 'No follow-up yet.'}`,
      overallScore: evaluation.totalScore,
      strengths: evaluation.strengths,
      gaps: evaluation.gaps,
      followUpQuestion: evaluation.followUpQuestion,
    };
  }

  private saveSessionSnapshot(sessionId: string): void {
    localStorage.setItem('intervu.session', JSON.stringify({ sessionId }));
  }

  private clearSessionSnapshot(): void {
    localStorage.removeItem('intervu.session');
  }

  private formatError(error: unknown): string {
    if (error instanceof HttpErrorResponse) {
      const detail = typeof error.error === 'string'
        ? error.error
        : error.error?.message || error.error?.error || error.statusText;
      return `Error ${error.status}: ${detail}`;
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong while loading the interview.';
  }
}
