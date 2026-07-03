import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-feedback-report',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 shadow-xl relative overflow-hidden">
      <!-- Glow effect based on score -->
      <div 
        class="absolute top-0 left-0 w-full h-1"
        [ngClass]="{
          'bg-red-500': score() < 60,
          'bg-yellow-500': score() >= 60 && score() < 80,
          'bg-green-500': score() >= 80
        }"
      ></div>

      <div class="flex justify-between items-start border-b border-gray-700 pb-4 mb-5">
        <div>
          <p class="text-xs font-semibold tracking-wider text-green-400 uppercase mb-1">Feedback Report</p>
          <h2 class="text-2xl font-bold text-gray-100">Evaluation Complete</h2>
        </div>
        
        <div class="text-center bg-gray-900 border border-gray-700 rounded-lg px-4 py-2">
          <span class="block text-xs text-gray-500 uppercase tracking-wider mb-1">Total Score</span>
          <strong class="text-3xl font-black" [ngClass]="{
            'text-red-400': score() < 60,
            'text-yellow-400': score() >= 60 && score() < 80,
            'text-green-400': score() >= 80
          }">{{ score() }}<span class="text-lg text-gray-600">/100</span></strong>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Rubric Scores -->
        <div class="bg-gray-900/50 rounded-lg p-4 border border-gray-700">
          <h3 class="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4 border-b border-gray-700 pb-2">Rubric Breakdown</h3>
          <ul class="space-y-3">
            @for (item of rubricKeys(); track item) {
              <li class="flex justify-between items-center">
                <span class="text-sm text-gray-400 capitalize">{{ item.replace('_', ' ') }}</span>
                <span class="text-sm font-medium text-gray-200 bg-gray-800 px-2 py-1 rounded">{{ rubric()[item] }} pts</span>
              </li>
            }
          </ul>
        </div>

        <!-- Strengths and Gaps -->
        <div class="flex flex-col gap-4">
          <div class="bg-green-900/10 border border-green-900/30 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-green-400 uppercase tracking-wider mb-3">Strengths</h3>
            <ul class="space-y-2">
              @for (strength of strengths(); track strength) {
                <li class="flex items-start gap-2 text-sm text-gray-300">
                  <span class="text-green-500 mt-0.5">✓</span>
                  <span>{{ strength }}</span>
                </li>
              }
            </ul>
          </div>

          <div class="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
            <h3 class="text-sm font-semibold text-red-400 uppercase tracking-wider mb-3">Areas for Improvement</h3>
            <ul class="space-y-2">
              @for (gap of gaps(); track gap) {
                <li class="flex items-start gap-2 text-sm text-gray-300">
                  <span class="text-red-500 mt-0.5">✗</span>
                  <span>{{ gap }}</span>
                </li>
              }
            </ul>
          </div>
        </div>
      </div>

      <!-- Follow-up Question -->
      <div class="mt-6 bg-blue-900/10 border border-blue-900/30 rounded-lg p-5">
        <h3 class="text-sm font-semibold text-blue-400 uppercase tracking-wider mb-2">Follow-up Challenge</h3>
        <p class="text-gray-200 text-lg italic leading-relaxed">"{{ followUp() }}"</p>
      </div>

      <!-- Action -->
      <div class="mt-6 flex justify-end">
        <button 
          (click)="continue.emit()"
          class="bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-6 rounded-md transition-colors"
        >
          Acknowledge & Continue
        </button>
      </div>
    </section>
  `
})
export class FeedbackReportComponent {
  score = input.required<number>();
  rubric = input.required<Record<string, number>>();
  strengths = input.required<string[]>();
  gaps = input.required<string[]>();
  followUp = input.required<string>();

  continue = output<void>();

  rubricKeys(): string[] {
    return Object.keys(this.rubric());
  }
}
