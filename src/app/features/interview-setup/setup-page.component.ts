import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { InterviewStateService } from '../interview-workspace/services/interview-state.service';
import { InterviewApiService } from '../../core/api/interview-api.service';
import { AuthService } from '../../core/auth/auth.service';

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
          <span class="text-sm font-medium text-gray-300">Account</span>
          <input type="text" [value]="userEmail()" readonly class="bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-gray-400" />
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">Skills</span>
          <textarea rows="3" formControlName="skills" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"></textarea>
        </label>

        <label class="flex flex-col gap-1.5">
          <span class="text-sm font-medium text-gray-300">Focus areas</span>
          <textarea rows="3" formControlName="focusAreas" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all"></textarea>
        </label>

        <!-- Resume / JD -->
        <div class="border border-gray-700 rounded-lg p-4 flex flex-col gap-4">
          <p class="text-xs font-semibold tracking-wider text-purple-400 uppercase">Optional context</p>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-gray-300">Resume (PDF / DOCX, 5MB)</span>
            <div class="flex items-center gap-3">
              <input #resumeInput type="file" accept=".pdf,.docx,.doc" class="text-sm text-gray-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:bg-purple-600 file:text-white file:cursor-pointer hover:file:bg-purple-700" (change)="onResumeSelected($event)" />
              <button type="button" class="bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50" [disabled]="!pendingResume() || isUploading()" (click)="uploadResume()">
                {{ isUploading() ? 'Uploading…' : 'Upload' }}
              </button>
            </div>
            @if (resumeStatus()) {
              <p class="text-xs" [class.text-green-400]="resumeOk()" [class.text-red-400]="!resumeOk()">{{ resumeStatus() }}</p>
            }
          </div>

          <div class="flex flex-col gap-2">
            <span class="text-sm font-medium text-gray-300">Job description</span>
            <textarea rows="3" [value]="jdText()" (input)="jdText.set(asText($event))" class="bg-gray-900 border border-gray-700 rounded-md px-3 py-2 text-gray-100 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all" placeholder="Paste the role description to auto-fill technologies…"></textarea>
            <button type="button" class="self-start bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium py-1.5 px-3 rounded-md transition-colors disabled:opacity-50" [disabled]="jdText().trim().length === 0 || isSavingJd()" (click)="saveJd()">
              {{ isSavingJd() ? 'Saving…' : 'Use JD' }}
            </button>
            @if (jdStatus()) {
              <p class="text-xs" [class.text-green-400]="jdOk()" [class.text-red-400]="!jdOk()">{{ jdStatus() }}</p>
            }
          </div>
        </div>

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
  private readonly api = inject(InterviewApiService);
  private readonly authService = inject(AuthService);
  private readonly fb = inject(FormBuilder);

  readonly setupForm = this.fb.nonNullable.group({
    targetRole: ['Senior Backend Engineer', Validators.required],
    seniority: ['SENIOR', Validators.required],
    mode: ['CODE', Validators.required],
    skills: ['Java, Spring Boot, Kafka'],
    focusAreas: ['Concurrency, Scaling'],
  });
  readonly userEmail = signal(this.authService.user()?.email ?? '');

  readonly pendingResume = signal<File | null>(null);
  readonly isUploading = signal(false);
  readonly resumeStatus = signal('');
  readonly resumeOk = signal(false);
  readonly resumeExtractId = signal<string | null>(null);

  readonly jdText = signal('');
  readonly isSavingJd = signal(false);
  readonly jdStatus = signal('');
  readonly jdOk = signal(false);
  readonly jdExtractId = signal<string | null>(null);

  onResumeSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.pendingResume.set(input.files && input.files.length > 0 ? input.files[0] : null);
    this.resumeStatus.set('');
  }

  asText(event: Event): string {
    return (event.target as HTMLTextAreaElement).value;
  }

  uploadResume(): void {
    const file = this.pendingResume();
    if (!file) return;
    this.isUploading.set(true);
    this.resumeStatus.set('');
    this.api.uploadResume(file).subscribe({
      next: (extract) => {
        this.resumeExtractId.set(extract.id);
        this.applyResumeAutoFill(extract);
        this.resumeOk.set(true);
        this.resumeStatus.set(`Parsed resume: ${extract.skills.length} skill(s) detected.`);
        this.isUploading.set(false);
      },
      error: (err) => {
        this.resumeOk.set(false);
        this.resumeStatus.set('Could not parse resume. ' + this.message(err));
        this.isUploading.set(false);
      },
    });
  }

  saveJd(): void {
    const text = this.jdText().trim();
    if (!text) return;
    this.isSavingJd.set(true);
    this.jdStatus.set('');
    this.api.createJd(text).subscribe({
      next: (extract) => {
        this.jdExtractId.set(extract.id);
        if (this.setupForm.controls.skills.value.trim().length === 0 && extract.technologies.length > 0) {
          this.setupForm.controls.skills.setValue(extract.technologies.join(', '));
        }
        this.jdOk.set(true);
        this.jdStatus.set(`Saved JD: ${extract.technologies.length} technologies detected.`);
        this.isSavingJd.set(false);
      },
      error: (err) => {
        this.jdOk.set(false);
        this.jdStatus.set('Could not save JD. ' + this.message(err));
        this.isSavingJd.set(false);
      },
    });
  }

  startInterview(): void {
    if (this.setupForm.invalid) {
      this.setupForm.markAllAsTouched();
      return;
    }

    const request = {
      targetRole: this.setupForm.controls.targetRole.value.trim(),
      seniority: this.setupForm.controls.seniority.value.trim(),
      mode: this.setupForm.controls.mode.value.trim(),
      skills: this.toList(this.setupForm.controls.skills.value),
      focusAreas: this.toList(this.setupForm.controls.focusAreas.value),
      resumeExtractId: this.resumeExtractId(),
      jdExtractId: this.jdExtractId(),
    };

    void this.state.startInterview(request);
  }

  restoreSession(): void {
    const sessionId = this.state.loadSessionSnapshot()?.sessionId;
    if (sessionId) {
      void this.state.restoreSession(sessionId);
    }
  }

  private applyResumeAutoFill(extract: { targetRole: string | null; skills: string[]; focusAreas: string[] }): void {
    if (this.setupForm.controls.targetRole.value.trim().length === 0 && extract.targetRole) {
      this.setupForm.controls.targetRole.setValue(extract.targetRole);
    }
    if (this.setupForm.controls.skills.value.trim().length === 0 && extract.skills.length > 0) {
      this.setupForm.controls.skills.setValue(extract.skills.join(', '));
    }
    if (this.setupForm.controls.focusAreas.value.trim().length === 0 && extract.focusAreas.length > 0) {
      this.setupForm.controls.focusAreas.setValue(extract.focusAreas.join(', '));
    }
  }

  private toList(value: string): string[] {
    return value.split(',').map(e => e.trim()).filter(Boolean);
  }

  private message(err: unknown): string {
    if (err && typeof err === 'object' && 'statusText' in err) {
      return (err as { statusText?: string }).statusText ?? 'Request failed';
    }
    return 'Request failed';
  }
}
