import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DashboardService } from './dashboard.service';
import type { DashboardSessionSummary } from '../../core/models/interview.models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <header class="dashboard-header">
        <h1>Interview Sessions</h1>
        <button class="btn btn-primary" (click)="startNewInterview()">
          + Start New Interview
        </button>
      </header>

      @if (loading()) {
        <div class="loading-state">Loading sessions...</div>
      }

      @if (error()) {
        <div class="error-state">{{ error() }}</div>
      }

      @if (!loading() && sessions().length === 0) {
        <div class="empty-state">
          <p>No interview sessions yet.</p>
          <p>Start a new interview to begin preparing.</p>
        </div>
      }

      @if (!loading() && sessions().length > 0) {
        <div class="session-list">
          @for (session of sessions(); track session.sessionId) {
            <div class="session-card" [class.completed]="session.state === 'COMPLETED'">
              <div class="session-info">
                <h3 class="session-role">{{ session.targetRole }}</h3>
                <div class="session-meta">
                  <span class="tag mode">{{ session.mode }}</span>
                  <span class="tag seniority">{{ session.seniority }}</span>
                  <span class="tag state" [class]="'state-' + session.state.toLowerCase()">
                    {{ session.summary }}
                  </span>
                </div>
                @if (session.overallScore !== null) {
                  <div class="session-score">
                    <span class="score-label">Score:</span>
                    <span class="score-value" [class]="scoreClass(session.overallScore)">
                      {{ session.overallScore }}
                    </span>
                  </div>
                }
                <div class="session-date">
                  Created: {{ formatDate(session.createdAt) }}
                </div>
              </div>
              <div class="session-actions">
                @if (session.state === 'COMPLETED') {
                  <button class="btn btn-secondary" (click)="viewFeedback(session.sessionId)">
                    View Feedback
                  </button>
                } @else if (session.state === 'CREATED' || session.state === 'IN_PROGRESS') {
                  <button class="btn btn-primary" (click)="resumeInterview(session.sessionId)">
                    Resume
                  </button>
                }
                <button
                  class="btn btn-danger"
                  (click)="confirmDelete(session.sessionId)"
                >
                  Delete
                </button>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `,
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly router = inject(Router);

  readonly sessions = signal<DashboardSessionSummary[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private readonly userId = 'demo-user';

  ngOnInit(): void {
    this.loadSessions();
  }

  loadSessions(): void {
    this.loading.set(true);
    this.error.set(null);
    this.dashboardService.loadDashboard(this.userId).subscribe({
      next: (sessions) => {
        this.sessions.set(sessions);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load sessions. Please try again.');
        this.loading.set(false);
        console.error('Dashboard load error:', err);
      },
    });
  }

  startNewInterview(): void {
    this.router.navigate(['/interview/new']);
  }

  resumeInterview(sessionId: string): void {
    this.router.navigate(['/interview', sessionId]);
  }

  viewFeedback(sessionId: string): void {
    this.router.navigate(['/interview', sessionId, 'feedback']);
  }

  confirmDelete(sessionId: string): void {
    if (confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      this.dashboardService.deleteSession(this.userId, sessionId).subscribe({
        next: () => this.loadSessions(),
        error: (err) => {
          this.error.set('Failed to delete session.');
          console.error('Delete error:', err);
        },
      });
    }
  }

  scoreClass(score: number): string {
    if (score >= 80) return 'score-strong';
    if (score >= 60) return 'score-solid';
    if (score >= 40) return 'score-mixed';
    return 'score-weak';
  }

  formatDate(dateStr: string | null): string {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}