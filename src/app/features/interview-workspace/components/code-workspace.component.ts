import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  ViewChild,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QuestionPayload } from '../../../core/models/interview.models';
import { InterviewStateService } from '../services/interview-state.service';

// Monaco is loaded globally via angular.json assets — typed loosely here
declare const monaco: any;

@Component({
  selector: 'app-code-workspace',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-4 shadow-lg h-full">
      <!-- Header: title + language selector -->
      <div class="flex justify-between items-center pb-3 border-b border-gray-700">
        <div>
          <p class="text-xs font-semibold tracking-wider text-blue-400 uppercase mb-1">Your answer</p>
          <h3 class="text-lg font-bold text-gray-100">Code Editor</h3>
        </div>

        <div class="flex items-center gap-2">
          <label for="language-select" class="text-sm font-medium text-gray-300">Language:</label>
          <select
            id="language-select"
            [formControl]="languageControl"
            (change)="onLanguageChange($event)"
            class="bg-gray-900 border border-gray-700 rounded px-3 py-1.5 text-gray-100 text-sm focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            @for (lang of languages; track lang.value) {
              <option [value]="lang.value">{{ lang.label }}</option>
            }
          </select>
        </div>
      </div>

      <!-- Monaco Editor Container -->
      <div
        #editorContainer
        class="flex-1 min-h-[350px] border border-gray-700 rounded-md overflow-hidden"
        style="min-height: 350px;"
      ></div>

      <!-- Approach explanation -->
      <div class="flex flex-col gap-2">
        <label for="approach-textarea" class="text-sm font-medium text-gray-300">Approach Explanation</label>
        <textarea
          id="approach-textarea"
          rows="4"
          [formControl]="approachControl"
          placeholder="Explain your approach, complexity (Time & Space), edge cases, and trade-offs..."
          class="w-full bg-gray-900 border border-gray-700 rounded-md p-4 text-gray-100 font-mono text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all resize-none disabled:opacity-50 disabled:cursor-not-allowed"
        ></textarea>
      </div>

      <!-- Actions -->
      <div class="flex justify-between items-center pt-2">
        <button
          type="button"
          (click)="saveDraft()"
          [disabled]="isSubmitting()"
          class="bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Save Draft
        </button>

        <button
          type="button"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          (click)="onSubmit()"
          [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Scoring...' : 'Submit Answer' }}
        </button>
      </div>
    </section>
  `
})
export class CodeWorkspaceComponent implements AfterViewInit, OnDestroy {
  @ViewChild('editorContainer', { static: true }) editorContainer!: ElementRef<HTMLDivElement>;

  question = input.required<QuestionPayload>();
  isSubmitting = input<boolean>(false);
  answerSubmitted = output<string>();

  private readonly stateService = inject(InterviewStateService);

  approachControl = new FormControl('');
  languageControl = new FormControl('java');

  languages = [
    { value: 'java', label: 'Java' },
    { value: 'python', label: 'Python' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'go', label: 'Go' },
    { value: 'cpp', label: 'C++' },
  ];

  private editorInstance: any = null;
  private lastRestoredKey: string | null = null;

  constructor() {
    // Restore draft when session + question become available
    effect(() => {
      const sessionId = this.stateService.session()?.sessionId;
      const questionId = this.question()?.id;
      if (sessionId && questionId) {
        const key = `${sessionId}.${questionId}`;
        if (key !== this.lastRestoredKey) {
          this.lastRestoredKey = key;
          this.restoreDraft();
        }
      }
    });

    // Sync editor read-only state and form controls with isSubmitting signal
    effect(() => {
      const submitting = this.isSubmitting();
      if (this.editorInstance) {
        this.editorInstance.updateOptions({ readOnly: submitting });
      }
      if (submitting) {
        this.approachControl.disable();
        this.languageControl.disable();
      } else {
        this.approachControl.enable();
        this.languageControl.enable();
      }
    });
  }

  ngAfterViewInit(): void {
    this.waitForMonaco(() => this.initEditor());
  }

  ngOnDestroy(): void {
    this.editorInstance?.dispose();
  }

  private waitForMonaco(callback: () => void, attempts = 0): void {
    if (typeof monaco !== 'undefined') {
      callback();
    } else {
      const win = window as any;
      if (typeof win.require !== 'undefined' && !win.monacoLoading) {
        win.monacoLoading = true;
        win.require(['vs/editor/editor.main'], () => {
          callback();
        });
      } else if (attempts < 50) {
        setTimeout(() => this.waitForMonaco(callback, attempts + 1), 100);
      } else {
        console.warn('[CodeWorkspace] Monaco did not load after 5 seconds — falling back');
      }
    }
  }

  private initEditor(): void {
    this.editorInstance = monaco.editor.create(this.editorContainer.nativeElement, {
      value: '',
      language: this.languageControl.value ?? 'java',
      theme: 'vs-dark',
      minimap: { enabled: false },
      automaticLayout: true,
      fontFamily: 'JetBrains Mono, Consolas, monospace',
      fontSize: 14,
      lineHeight: 20,
      scrollBeyondLastLine: false,
      readOnly: false,
    });

    // Restore any saved draft now that the Monaco model actually exists.
    this.restoreDraft();
  }

  onLanguageChange(event: Event): void {
    const lang = (event.target as HTMLSelectElement).value;
    if (this.editorInstance) {
      const model = this.editorInstance.getModel();
      if (model) {
        monaco.editor.setModelLanguage(model, lang);
      }
    }
  }

  // ── Draft persistence ────────────────────────────────────────────────

  private draftKey(): string | null {
    const sessionId = this.stateService.session()?.sessionId;
    const questionId = this.question()?.id;
    return sessionId && questionId ? `intervu.draft.${sessionId}.${questionId}` : null;
  }

  saveDraft(): void {
    const key = this.draftKey();
    if (!key) {
      console.warn('[CodeWorkspace] Cannot save draft: no active session/question');
      return;
    }
    try {
      const draft = {
        code: this.editorInstance?.getValue() ?? '',
        language: this.languageControl.value ?? 'java',
        approach: this.approachControl.value ?? '',
      };
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (e) {
      console.error('[CodeWorkspace] Failed to save draft', e);
    }
  }

  private restoreDraft(): void {
    const key = this.draftKey();
    if (!key) return;
    try {
      const raw = localStorage.getItem(key);
      if (!raw) {
        this.clearInputs();
        return;
      }
      const draft = JSON.parse(raw) as { code?: string; language?: string; approach?: string };
      const lang = draft.language ?? 'java';
      this.languageControl.setValue(lang);
      this.approachControl.setValue(draft.approach ?? '');
      if (this.editorInstance) {
        this.editorInstance.setValue(draft.code ?? '');
        const model = this.editorInstance.getModel();
        if (model) monaco.editor.setModelLanguage(model, lang);
      }
    } catch (e) {
      console.error('[CodeWorkspace] Failed to restore draft', e);
      this.clearInputs();
    }
  }

  private clearInputs(): void {
    this.approachControl.setValue('');
    this.languageControl.setValue('java');
    this.editorInstance?.setValue('');
  }

  // ── Static analysis ──────────────────────────────────────────────────

  private runStaticAnalysis(code: string) {
    // Strip line and block comments before analysis
    const clean = code
      .replace(/\/\*[\s\S]*?\*\//g, '')
      .replace(/\/\/.*$/gm, '')
      .replace(/#.*$/gm, '');
    const trimmed = clean.trim();
    const noWs = clean.replace(/\s+/g, '');

    const codeBlank = trimmed.length === 0;
    const codeShort = !codeBlank && noWs.length < 50;
    const hasLoops = /\bfor\b/.test(clean) || /\bwhile\b/.test(clean);
    const hasCollections = /\bMap\b/.test(clean) || /\bList\b/.test(clean)
      || /\bSet\b/.test(clean) || /\bHashMap\b/.test(clean);
    const hasEdgeCases = /\b(null|empty|duplicate|boundary)\b/i.test(clean);

    // Recursion: detect named function/method calling itself inside its own body
    let hasRecursion = false;
    const methodRe = /\b(\w+)\s*\([^)]*\)\s*(?:throws\s+[\w\s,]+)?\s*\{/g;
    let m: RegExpExecArray | null;
    while ((m = methodRe.exec(clean)) !== null) {
      const name = m[1];
      if (['if', 'for', 'while', 'switch', 'catch', 'try', 'synchronized', 'lock'].includes(name)) continue;
      const bodyStart = clean.indexOf('{', m.index);
      if (bodyStart === -1) continue;
      let depth = 0, i = bodyStart, bodyEnd = clean.length;
      for (; i < clean.length; i++) {
        if (clean[i] === '{') depth++;
        else if (clean[i] === '}') { depth--; if (depth === 0) { bodyEnd = i; break; } }
      }
      const body = clean.slice(bodyStart + 1, bodyEnd);
      const callRe = new RegExp(`\\b${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*\\(`, 'g');
      if (callRe.test(body)) hasRecursion = true;
    }

    return { codeBlank, codeShort, hasLoops, hasCollections, hasRecursion, hasEdgeCases };
  }

  // ── Submission ───────────────────────────────────────────────────────

  onSubmit(): void {
    const code = this.editorInstance?.getValue() ?? '';
    const language = this.languageControl.value ?? 'java';
    const approach = this.approachControl.value ?? '';
    const analysis = this.runStaticAnalysis(code);

    const payload = [
      `[LANGUAGE: ${language}]`,
      '',
      '[CODE]',
      code,
      '',
      '[APPROACH]',
      approach,
      '',
      '[STATIC_ANALYSIS]',
      `codeBlank: ${analysis.codeBlank}`,
      `codeShort: ${analysis.codeShort}`,
      `hasLoops: ${analysis.hasLoops}`,
      `hasCollections: ${analysis.hasCollections}`,
      `hasRecursion: ${analysis.hasRecursion}`,
      `hasEdgeCases: ${analysis.hasEdgeCases}`,
    ].join('\n');

    this.answerSubmitted.emit(payload);

    // Clear draft from localStorage after successful submission
    const key = this.draftKey();
    if (key) {
      try { localStorage.removeItem(key); } catch { /* ignore */ }
    }

    this.clearInputs();
  }
}
