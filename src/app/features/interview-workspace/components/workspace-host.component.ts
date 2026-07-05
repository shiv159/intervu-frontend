import { Component, input, output } from '@angular/core';
import { QuestionPayload } from '../../../core/models/interview.models';
import { CodeWorkspaceComponent } from './code-workspace.component';
import { SystemDesignWorkspaceComponent } from './system-design-workspace.component';
import { ConversationalWorkspaceComponent } from './conversational-workspace.component';

@Component({
  selector: 'app-workspace-host',
  standalone: true,
  imports: [CodeWorkspaceComponent, SystemDesignWorkspaceComponent, ConversationalWorkspaceComponent],
  template: `
    @if (question()) {
      @switch (question()!.mode) {
        @case ('CODE') {
          <app-code-workspace 
            [question]="question()!" 
            [isSubmitting]="isSubmitting()"
            (answerSubmitted)="answerSubmitted.emit($event)" 
          />
        }
        @case ('SYSTEM_DESIGN') {
          <app-system-design-workspace
            [question]="question()!" 
            [isSubmitting]="isSubmitting()"
            (answerSubmitted)="answerSubmitted.emit($event)" 
          />
        }
        @case ('BEHAVIORAL') {
          <app-conversational-workspace
            [question]="question()!" 
            [isSubmitting]="isSubmitting()"
            (answerSubmitted)="answerSubmitted.emit($event)" 
          />
        }
        @case ('CONVERSATIONAL') {
          <app-conversational-workspace
            [question]="question()!" 
            [isSubmitting]="isSubmitting()"
            (answerSubmitted)="answerSubmitted.emit($event)" 
          />
        }
        @default {
          <app-conversational-workspace 
            [question]="question()!" 
            [isSubmitting]="isSubmitting()"
            (answerSubmitted)="answerSubmitted.emit($event)" 
          />
        }
      }
    } @else {
      <div class="h-full flex items-center justify-center bg-gray-800 border border-gray-700 rounded-xl p-8 text-center shadow-lg">
        <div>
          <p class="text-gray-300 font-medium text-lg mb-2">The first question will appear here once you start a session.</p>
          <p class="text-gray-500 text-sm max-w-md mx-auto">This MVP already talks to the backend, stores session state, and returns scored feedback without pretending code execution exists.</p>
        </div>
      </div>
    }
  `
})
export class WorkspaceHostComponent {
  question = input<QuestionPayload | null>(null);
  isSubmitting = input<boolean>(false);
  answerSubmitted = output<string>();
}
