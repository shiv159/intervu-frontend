import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { InterviewStateService } from './services/interview-state.service';
import { WorkspaceHostComponent } from './components/workspace-host.component';
import { FeedbackReportComponent } from './components/feedback-report.component';
import { SetupPageComponent } from '../interview-setup/setup-page.component';

@Component({
  selector: 'app-interview-shell',
  standalone: true,
  imports: [CommonModule, WorkspaceHostComponent, FeedbackReportComponent, SetupPageComponent],
  template: `
    <div class="flex flex-col h-full gap-6">
      @if (state.session()?.aiMode === 'MOCK') {
        <div class="bg-purple-900/30 border border-purple-700/50 text-purple-200 text-sm font-medium px-4 py-2 rounded-lg">
          Running in MOCK mode — evaluations are deterministic
        </div>
      }

      <!-- Evaluation Status Stepper -->
      <nav aria-label="Progress" class="bg-gray-800 border border-gray-700 rounded-xl p-4 shadow-sm">
        <ol role="list" class="flex items-center">
          <li class="relative pr-8 sm:pr-20">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="h-0.5 w-full" [ngClass]="state.session() ? 'bg-purple-600' : 'bg-gray-700'"></div>
            </div>
            <a class="relative flex h-8 w-8 items-center justify-center rounded-full bg-purple-600 hover:bg-purple-900">
              <svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
              </svg>
            </a>
          </li>
          <li class="relative pr-8 sm:pr-20">
            <div class="absolute inset-0 flex items-center" aria-hidden="true">
              <div class="h-0.5 w-full" [ngClass]="state.lastEvaluation() ? 'bg-purple-600' : 'bg-gray-700'"></div>
            </div>
            <a class="relative flex h-8 w-8 items-center justify-center rounded-full"
               [ngClass]="state.session() ? (state.isSubmitting() ? 'bg-purple-600 animate-pulse' : 'bg-purple-600') : 'bg-gray-700 border-2 border-gray-500'">
              @if (state.lastEvaluation()) {
                <svg class="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd" />
                </svg>
              } @else {
                <span class="text-white text-xs font-bold">2</span>
              }
            </a>
          </li>
          <li class="relative">
            <a class="relative flex h-8 w-8 items-center justify-center rounded-full"
               [ngClass]="state.lastEvaluation() ? 'bg-purple-600' : 'bg-gray-700 border-2 border-gray-500'">
              <span class="text-white text-xs font-bold">3</span>
            </a>
          </li>
        </ol>
      </nav>

      <!-- Interviewer Panel -->
      <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg" aria-label="Interviewer and answer workspace">
        <div class="flex justify-between items-start border-b border-gray-700 pb-4">
          <div>
            <p class="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">AI interviewer</p>
            <h2 class="text-2xl font-bold text-gray-100">
              {{ state.session()?.state === 'COMPLETED' ? 'Session Complete' : (state.question()?.title || 'No interview started yet') }}
            </h2>
          </div>

          @if (state.question()) {
            <span class="bg-purple-900/40 text-purple-300 border border-purple-700/50 text-xs font-medium px-2.5 py-1 rounded-full">
              {{ state.question()?.mode }} · v{{ state.question()?.version }}
            </span>
          } @else if (state.session()?.state === 'COMPLETED') {
            <span class="bg-green-900/40 text-green-300 border border-green-700/50 text-xs font-medium px-2.5 py-1 rounded-full">Completed</span>
          } @else {
            <span class="bg-gray-700 text-gray-400 text-xs font-medium px-2.5 py-1 rounded-full">Awaiting session</span>
          }
        </div>

        @if (state.question(); as q) {
          <article class="pt-2">
            <p class="text-gray-300 text-base leading-relaxed mb-6">{{ q.prompt }}</p>

            <div class="flex flex-wrap gap-2 mb-6">
              @for (item of q.expectedConcepts; track item) {
                <span class="bg-gray-900 border border-gray-700 text-gray-400 text-xs px-2.5 py-1 rounded">{{ item }}</span>
              }
            </div>

            <div class="grid grid-cols-3 gap-4 border-t border-gray-700 pt-4">
              <div>
                <span class="block text-xs text-gray-500 uppercase tracking-wider mb-1">Difficulty</span>
                <strong class="text-gray-200 text-sm">{{ q.difficulty }}</strong>
              </div>
              <div>
                <span class="block text-xs text-gray-500 uppercase tracking-wider mb-1">Seniority</span>
                <strong class="text-gray-200 text-sm">{{ q.seniority }}</strong>
              </div>
              <div>
                <span class="block text-xs text-gray-500 uppercase tracking-wider mb-1">Workspace</span>
                <strong class="text-gray-200 text-sm">{{ q.mode }}</strong>
              </div>
            </div>
          </article>
        }
      </section>

      <!-- Workspace Host or Feedback Report -->
      <div class="flex-1 min-h-[400px]">
        @if (state.session()?.state === 'WAITING_EVALUATION') {
          <div class="flex flex-col items-center justify-center h-full text-center bg-gray-800 border border-gray-700 rounded-xl p-8">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mb-4"></div>
            <h3 class="text-xl font-bold text-gray-100 mb-2">Evaluating your answer…</h3>
            <p class="text-gray-400">This may take a few seconds.</p>
          </div>
        } @else if (state.lastEvaluation(); as eval) {
          <app-feedback-report
            [score]="eval.totalScore"
            [rubric]="eval.rubricScores"
            [strengths]="eval.strengths"
            [gaps]="eval.gaps"
            [followUp]="eval.followUpQuestion ?? ''"
            [provider]="eval.provider"
            [model]="eval.model"
            (continue)="onAcknowledgeFeedback()"
          />
        } @else if (!state.hasSession()) {
          <app-setup-page />
        } @else if (state.session()?.state === 'COMPLETED') {
          <div class="flex flex-col items-center justify-center h-full text-center bg-gray-800 border border-gray-700 rounded-xl p-8">
            <h3 class="text-3xl font-bold text-white mb-3">Interview Complete!</h3>
            <p class="text-gray-300 max-w-md">You've reached the end of this session. Great job practicing your skills!</p>
            <button 
              type="button"
              class="mt-8 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-8 rounded-lg shadow-lg transition-transform hover:scale-105"
              (click)="onFinishInterview()">
              Return to Setup
            </button>
          </div>
        } @else {
          <app-workspace-host 
            [question]="state.question()"
            [isSubmitting]="state.isSubmitting()"
            (answerSubmitted)="onAnswerSubmitted($event)"
          />
        }
      </div>

    </div>
  `
})
export class InterviewShellComponent {
  readonly state = inject(InterviewStateService);

  onAnswerSubmitted(answer: string) {
    void this.state.submitAnswer(answer);
  }

  onAcknowledgeFeedback() {
    void this.state.acknowledgeFeedback();
  }

  onFinishInterview() {
    this.state.resetInterview();
  }
}
