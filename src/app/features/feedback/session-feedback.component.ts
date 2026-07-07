import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { DashboardService } from '../dashboard/dashboard.service';
import type {
  SessionFeedbackResponse,
  RoundFeedback,
  TopicMastery,
} from '../../core/models/interview.models';

@Component({
  selector: 'app-session-feedback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="feedback-page">
      @if (loading()) {
        <div class="loading-state">Loading feedback report...</div>
      }

      @if (error()) {
        <div class="error-state">{{ error() }}</div>
        <button class="btn btn-secondary" (click)="goBack()">Back to Dashboard</button>
      }

      @if (feedback(); as fb) {
        <header class="feedback-header">
          <button class="back-btn" (click)="goBack()">← Back to Dashboard</button>
          <h1>Session Feedback Report</h1>
          <div class="header-meta">
            <span class="tag">{{ fb.mode }}</span>
            <span class="tag">{{ fb.seniority }}</span>
            <span class="tag readiness" [class]="readinessClass(fb.overallReadiness)">
              {{ fb.overallReadiness }}
            </span>
          </div>
        </header>

        <!-- Overall Score Card -->
        <section class="score-card">
          <div class="score-circle" [class]="readinessClass(fb.overallReadiness)">
            <span class="score-number">{{ fb.overallScore }}</span>
            <span class="score-out-of">/100</span>
          </div>
          <div class="score-details">
            <h2>Overall Readiness: {{ fb.overallReadiness }}</h2>
            <p class="score-desc">
              Based on {{ fb.rounds.length }} question{{ fb.rounds.length !== 1 ? 's' : '' }}
            </p>
          </div>
        </section>

        <!-- Topic Mastery -->
        @if (topicKeys(fb.topicMastery).length > 0) {
          <section class="section">
            <h2>Topic Mastery</h2>
            <div class="mastery-grid">
              @for (key of topicKeys(fb.topicMastery); track key) {
                @let mastery = fb.topicMastery[key]; // topicMastery is already a Record
                <div class="mastery-card">
                  <div class="mastery-header">
                    <span class="mastery-topic">{{ mastery.topic }}</span>
                    <span class="mastery-band" [class]="bandClass(mastery.band)">{{ mastery.band }}</span>
                  </div>
                  <div class="mastery-bar-container">
                    <div
                      class="mastery-bar"
                      [style.width.%]="mastery.averageScore"
                      [class]="bandClass(mastery.band)"
                    ></div>
                  </div>
                  <div class="mastery-stats">
                    {{ mastery.averageScore }}/100 · {{ mastery.questionCount }} question{{ mastery.questionCount !== 1 ? 's' : '' }}
                  </div>
                </div>
              }
            </div>
          </section>
        }

        <!-- Strengths -->
        @if (fb.strengths.length > 0) {
          <section class="section">
            <h2>Strengths</h2>
            <ul class="bullet-list strengths">
              @for (item of fb.strengths; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>
        }

        <!-- Areas for Growth -->
        @if (fb.areasForGrowth.length > 0) {
          <section class="section">
            <h2>Areas for Growth</h2>
            <ul class="bullet-list growth">
              @for (item of fb.areasForGrowth; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>
        }

        <!-- Recommended Practice -->
        @if (fb.recommendedPractice.length > 0) {
          <section class="section">
            <h2>Recommended Practice Plan</h2>
            <ul class="bullet-list practice">
              @for (item of fb.recommendedPractice; track $index) {
                <li>{{ item }}</li>
              }
            </ul>
          </section>
        }

        <!-- Per-Question Detail -->
        <section class="section">
          <h2>Question-by-Question Review</h2>
          <div class="rounds-list">
            @for (round of fb.rounds; track round.questionId; let i = $index) {
              <div class="round-card">
                <div class="round-header">
                  <span class="round-number">Q{{ i + 1 }}</span>
                  <span class="round-title">{{ round.questionTitle }}</span>
                  <span class="round-score" [class]="scoreClass(round.score)">{{ round.score }}/100</span>
                </div>

                @if (objectKeys(round.rubricScores).length > 0) {
                  <div class="rubric-scores">
                    @for (rubricKey of objectKeys(round.rubricScores); track rubricKey) {
                      <div class="rubric-item">
                        <span class="rubric-label">{{ rubricKey }}</span>
                        <span class="rubric-value">{{ round.rubricScores[rubricKey] }}</span>
                      </div>
                    }
                  </div>
                }

                <div class="round-details">
                  @if (round.strengths.length > 0) {
                    <div class="round-strengths">
                      <strong>Strengths:</strong>
                      <ul>
                        @for (s of round.strengths; track $index) {
                          <li>{{ s }}</li>
                        }
                      </ul>
                    </div>
                  }
                  @if (round.gaps.length > 0) {
                    <div class="round-gaps">
                      <strong>Areas for growth:</strong>
                      <ul>
                        @for (g of round.gaps; track $index) {
                          <li>{{ g }}</li>
                        }
                      </ul>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>

        <!-- Session Info Footer -->
        <footer class="feedback-footer">
          <p>Session created: {{ formatDate(fb.createdAt) }}</p>
          @if (fb.completedAt) {
            <p>Completed: {{ formatDate(fb.completedAt) }}</p>
          }
        </footer>
      }
    </div>
  `,
  styleUrl: './session-feedback.component.css',
})
export class SessionFeedbackComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly dashboardService = inject(DashboardService);

  readonly feedback = signal<SessionFeedbackResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  private readonly userId = 'demo-user';

  ngOnInit(): void {
    const sessionId = this.route.snapshot.paramMap.get('id');
    if (!sessionId) {
      this.error.set('No session ID provided.');
      this.loading.set(false);
      return;
    }
    this.dashboardService.loadFeedback(this.userId, sessionId).subscribe({
      next: (fb) => {
        this.feedback.set(fb);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set('Failed to load feedback. Please try again.');
        this.loading.set(false);
        console.error('Feedback load error:', err);
      },
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  readinessClass(band: string): string {
    switch (band) {
      case 'Strong': return 'band-strong';
      case 'Solid': return 'band-solid';
      case 'Mixed': return 'band-mixed';
      case 'Needs Work': return 'band-needs-work';
      default: return '';
    }
  }

  bandClass(band: string): string {
    return this.readinessClass(band);
  }

  scoreClass(score: number): string {
    if (score >= 80) return 'score-strong';
    if (score >= 60) return 'score-solid';
    if (score >= 40) return 'score-mixed';
    return 'score-weak';
  }

  topicKeys(topicMastery: Record<string, TopicMastery>): string[] {
    return Object.keys(topicMastery);
  }

  objectKeys(obj: Record<string, number>): string[] {
    return Object.keys(obj);
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