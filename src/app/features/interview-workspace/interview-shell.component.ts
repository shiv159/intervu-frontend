import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { InterviewStateService } from './services/interview-state.service';
import { WorkspaceHostComponent } from './components/workspace-host.component';

@Component({
  selector: 'app-interview-shell',
  standalone: true,
  imports: [CommonModule, WorkspaceHostComponent],
  template: `
    <div class="flex flex-col h-full gap-6">
      
      <!-- Interviewer Panel -->
      <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg" aria-label="Interviewer and answer workspace">
        <div class="flex justify-between items-start border-b border-gray-700 pb-4">
          <div>
            <p class="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">AI interviewer</p>
            <h2 class="text-2xl font-bold text-gray-100">{{ state.question()?.title || 'No interview started yet' }}</h2>
          </div>

          @if (state.question()) {
            <span class="bg-purple-900/40 text-purple-300 border border-purple-700/50 text-xs font-medium px-2.5 py-1 rounded-full">
              {{ state.question()?.mode }} · v{{ state.question()?.version }}
            </span>
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

      <!-- Workspace Host (Code/Design) -->
      <div class="flex-1 min-h-[400px]">
        <app-workspace-host 
          [question]="state.question()"
          [isSubmitting]="state.isSubmitting()"
          (answerSubmitted)="onAnswerSubmitted($event)"
        />
      </div>

    </div>
  `
})
export class InterviewShellComponent {
  readonly state = inject(InterviewStateService);

  onAnswerSubmitted(answer: string) {
    void this.state.submitAnswer(answer);
  }
}
