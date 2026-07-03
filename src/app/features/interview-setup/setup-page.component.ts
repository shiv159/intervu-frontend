import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterviewStateService } from '../interview-workspace/services/interview-state.service';

@Component({
  selector: 'app-setup-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <aside class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-6 shadow-lg">
      <div class="flex justify-between items-start">
        <div>
          <p class="text-xs font-semibold tracking-wider text-purple-400 uppercase mb-1">Interview setup</p>
          <h2 class="text-xl font-bold text-gray-100">Start with a clean context</h2>
        </div>
        <button type="button" class="text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors" 
                (click)="state.resetInterview()" 
                [disabled]="state.isBusy() || state.isSubmitting() || state.isRestoring()">
          Reset
        </button>
      </div>

      <form class="flex flex-col gap-4" [formGroup]="setupForm" (ngSubmit)="startInterview()">
        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">Target role</span>
          <input type="text" formControlName="targetRole" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
        </label>

        <div class="grid grid-cols-2 gap-4">
          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-300">Seniority</span>
            <select formControlName="seniority" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
              <option value="JUNIOR">Junior</option>
              <option value="MID">Mid</option>
              <option value="SENIOR">Senior</option>
              <option value="STAFF">Staff</option>
            </select>
          </label>

          <label class="flex flex-col gap-1.5">
            <span class="text-sm font-medium text-gray-300">Mode</span>
            <select formControlName="mode" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all">
              <option value="CODE">Code</option>
              <option value="SYSTEM_DESIGN">System design</option>
              <option value="CONVERSATIONAL">Conversational</option>
            </select>
          </label>
        </div>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">User ID</span>
          <input type="text" formControlName="userId" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">Skills</span>
          <textarea rows="3" formControlName="skills" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"></textarea>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">Focus areas</span>
          <textarea rows="3" formControlName="focusAreas" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"></textarea>
        </label>

        <div class="flex gap-3 mt-2">
          <button type="submit" class="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  [disabled]="state.isBusy() || state.isRestoring()">
            {{ state.isBusy() ? 'Starting...' : 'Start Interview' }}
          </button>

          <button type="button" class="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed" 
                  (click)="restoreSession()" 
                  [disabled]="state.isBusy() || state.isSubmitting() || state.isRestoring()">
            {{ state.isRestoring() ? 'Restoring...' : 'Restore Session' }}
          </button>
        </div>
      </form>

      @if (state.errorMessage()) {
        <p class="text-red-400 text-sm font-medium bg-red-900/20 border border-red-900/50 rounded p-3">{{ state.errorMessage() }}</p>
      }
    </aside>
  `
})
export class SetupPageComponent {
  readonly state = inject(InterviewStateService);
  private readonly fb = inject(FormBuilder);

  readonly setupForm = this.fb.nonNullable.group({
    targetRole: ['Senior Backend Engineer', Validators.required],
    seniority: ['SENIOR', Validators.required],
    mode: ['CODE', Validators.required],
    userId: ['demo-user', Validators.required],
    skills: ['Java, Spring Boot, Kafka'],
    focusAreas: ['Concurrency, Scaling'],
  });

  startInterview(): void {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    const userId = this.setupForm.controls.userId.value.trim();
    const request = {
      targetRole: this.setupForm.controls.targetRole.value.trim(),
      seniority: this.setupForm.controls.seniority.value.trim(),
      mode: this.setupForm.controls.mode.value.trim(),
      skills: this.toList(this.setupForm.controls.skills.value),
      focusAreas: this.toList(this.setupForm.controls.focusAreas.value),
    };

    void this.state.startInterview(userId, request);
  }

  restoreSession(): void {
    const userId = this.setupForm.controls.userId.value.trim();
    const sessionId = this.state.loadSessionSnapshot()?.sessionId;
    if (sessionId) {
      void this.state.restoreSession(userId, sessionId);
    }
  }

  private toList(value: string): string[] {
    return value.split(',').map(e => e.trim()).filter(Boolean);
  }
}
