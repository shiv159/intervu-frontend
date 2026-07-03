import { Component, input, output, signal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { QuestionPayload } from '../../../core/models/interview.models';

@Component({
  selector: 'app-conversational-workspace',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg h-full">
      <!-- Header -->
      <div class="flex justify-between items-center pb-3 border-b border-gray-700">
        <div>
          <p class="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">Behavioral Response</p>
          <h3 class="text-lg font-bold text-gray-100">Draft your answer using the STAR method</h3>
        </div>
      </div>

      <!-- Main Input Area -->
      <div class="flex-1 flex flex-col gap-2 min-h-[350px]">
        <label for="behavioral-textarea" class="text-sm font-medium text-gray-300">
          Situation, Task, Action, Result
        </label>
        <textarea
          id="behavioral-textarea"
          [formControl]="answerControl"
          placeholder="Describe a specific situation...&#10;Explain the task or challenge...&#10;Detail the actions you took...&#10;Share the concrete results and impact..."
          class="w-full h-full flex-1 bg-gray-900 border border-gray-700 rounded-md p-4 text-gray-100 text-base leading-relaxed focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        ></textarea>
        
        <!-- Word count indicator -->
        <div class="flex justify-end mt-1">
          <span class="text-xs text-gray-500" [class.text-red-400]="wordCount() < 50 && wordCount() > 0">
            {{ wordCount() }} words (aim for 100-250)
          </span>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-end pt-2 border-t border-gray-700 mt-2">
        <button
          type="button"
          class="bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
          (click)="onSubmit()"
          [disabled]="isSubmitting() || !answerControl.value?.trim()">
          {{ isSubmitting() ? 'Evaluating...' : 'Submit Answer' }}
        </button>
      </div>
    </section>
  `
})
export class ConversationalWorkspaceComponent {
  question = input.required<QuestionPayload>();
  isSubmitting = input<boolean>(false);
  answerSubmitted = output<string>();

  answerControl = new FormControl({ value: '', disabled: false }, [Validators.required]);

  constructor() {
    this.answerControl.valueChanges.subscribe(() => {
      // Angular 17+ reactive inputs are supported via effects, but valueChanges works well for word count updates
    });
  }

  // Disable form control dynamically via effect
  // We use ngDoCheck or an effect for input bindings. But since isSubmitting is a signal, an effect is best.
  // Actually, I'll just rely on the template binding for the button, and use the effect for the textarea:
  private readonly _subEffect = import('@angular/core').then(({ effect }) => {
    effect(() => {
      if (this.isSubmitting()) {
        this.answerControl.disable({ emitEvent: false });
      } else {
        this.answerControl.enable({ emitEvent: false });
      }
    });
  });

  wordCount(): number {
    const text = this.answerControl.value || '';
    const trimmed = text.trim();
    if (!trimmed) return 0;
    return trimmed.split(/\s+/).length;
  }

  onSubmit(): void {
    if (this.answerControl.invalid) return;
    const answer = this.answerControl.value?.trim() || '';
    
    const payload = [
      '[MODE: BEHAVIORAL]',
      '',
      '[ANSWER]',
      answer
    ].join('\n');

    this.answerSubmitted.emit(payload);
    
    // Clear the input after submission for the next question (or let the parent unmount this component)
    this.answerControl.setValue('');
  }
}
