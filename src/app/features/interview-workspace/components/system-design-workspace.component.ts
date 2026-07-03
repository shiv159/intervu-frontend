import {
  Component,
  effect,
  inject,
  input,
  output,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { QuestionPayload } from '../../../core/models/interview.models';
import { InterviewStateService } from '../services/interview-state.service';

@Component({
  selector: 'app-system-design-workspace',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <section class="bg-gray-800 border border-gray-700 rounded-xl p-6 flex flex-col gap-5 shadow-lg h-full overflow-y-auto">
      <div class="flex justify-between items-center pb-3 border-b border-gray-700">
        <div>
          <p class="text-xs font-semibold tracking-wider text-green-400 uppercase mb-1">System Design</p>
          <h3 class="text-lg font-bold text-gray-100">Architect the solution</h3>
        </div>
      </div>

      <div class="flex flex-col gap-6 flex-1 min-h-[500px]">
        <!-- Requirements -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-300">1. Requirements & Constraints</label>
          <textarea
            rows="3"
            [formControl]="requirementsControl"
            [disabled]="isSubmitting()"
            placeholder="Functional and non-functional requirements, traffic estimates..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-y disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Architecture -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-300">2. High-Level Architecture</label>
          <textarea
            rows="5"
            [formControl]="architectureControl"
            [disabled]="isSubmitting()"
            placeholder="Main components, services, load balancers, caches..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-y disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Data Model -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-300">3. Data Model</label>
          <textarea
            rows="4"
            [formControl]="dataModelControl"
            [disabled]="isSubmitting()"
            placeholder="Database schemas, NoSQL documents, key-value designs..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-y disabled:opacity-50"
          ></textarea>
        </div>

        <!-- API Design -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-300">4. API Design</label>
          <textarea
            rows="3"
            [formControl]="apiDesignControl"
            [disabled]="isSubmitting()"
            placeholder="REST endpoints, gRPC services, GraphQL schemas..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-y disabled:opacity-50"
          ></textarea>
        </div>

        <!-- Trade-offs -->
        <div class="flex flex-col gap-2">
          <label class="text-sm font-medium text-gray-300">5. Trade-offs & Bottlenecks</label>
          <textarea
            rows="3"
            [formControl]="tradeoffsControl"
            [disabled]="isSubmitting()"
            placeholder="Single points of failure, eventual consistency, scaling limits..."
            class="w-full bg-gray-900 border border-gray-700 rounded-md p-3 text-gray-100 font-mono text-sm focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all resize-y disabled:opacity-50"
          ></textarea>
        </div>
      </div>

      <!-- Actions -->
      <div class="flex justify-between items-center pt-4 border-t border-gray-700 mt-2">
        <button
          type="button"
          (click)="saveDraft()"
          [disabled]="isSubmitting()"
          class="bg-gray-700 hover:bg-gray-600 text-gray-100 font-medium py-2 px-4 rounded-md transition-colors disabled:opacity-50"
        >
          Save Draft
        </button>

        <button
          type="button"
          class="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-8 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          (click)="onSubmit()"
          [disabled]="isSubmitting()">
          {{ isSubmitting() ? 'Scoring...' : 'Submit Design' }}
        </button>
      </div>
    </section>
  `
})
export class SystemDesignWorkspaceComponent {
  question = input.required<QuestionPayload>();
  isSubmitting = input<boolean>(false);
  answerSubmitted = output<string>();

  private readonly stateService = inject(InterviewStateService);

  requirementsControl = new FormControl('');
  architectureControl = new FormControl('');
  dataModelControl = new FormControl('');
  apiDesignControl = new FormControl('');
  tradeoffsControl = new FormControl('');

  private lastRestoredKey: string | null = null;

  constructor() {
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

    effect(() => {
      const submitting = this.isSubmitting();
      if (submitting) {
        this.requirementsControl.disable({ emitEvent: false });
        this.architectureControl.disable({ emitEvent: false });
        this.dataModelControl.disable({ emitEvent: false });
        this.apiDesignControl.disable({ emitEvent: false });
        this.tradeoffsControl.disable({ emitEvent: false });
      } else {
        this.requirementsControl.enable({ emitEvent: false });
        this.architectureControl.enable({ emitEvent: false });
        this.dataModelControl.enable({ emitEvent: false });
        this.apiDesignControl.enable({ emitEvent: false });
        this.tradeoffsControl.enable({ emitEvent: false });
      }
    });
  }

  private draftKey(): string | null {
    const sessionId = this.stateService.session()?.sessionId;
    const questionId = this.question()?.id;
    return sessionId && questionId ? `intervu.design.draft.${sessionId}.${questionId}` : null;
  }

  saveDraft(): void {
    const key = this.draftKey();
    if (!key) return;
    try {
      const draft = {
        requirements: this.requirementsControl.value ?? '',
        architecture: this.architectureControl.value ?? '',
        dataModel: this.dataModelControl.value ?? '',
        apiDesign: this.apiDesignControl.value ?? '',
        tradeoffs: this.tradeoffsControl.value ?? '',
      };
      localStorage.setItem(key, JSON.stringify(draft));
    } catch (e) {
      console.error('[SystemDesignWorkspace] Failed to save draft', e);
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
      const draft = JSON.parse(raw);
      this.requirementsControl.setValue(draft.requirements ?? '');
      this.architectureControl.setValue(draft.architecture ?? '');
      this.dataModelControl.setValue(draft.dataModel ?? '');
      this.apiDesignControl.setValue(draft.apiDesign ?? '');
      this.tradeoffsControl.setValue(draft.tradeoffs ?? '');
    } catch (e) {
      this.clearInputs();
    }
  }

  private clearInputs(): void {
    this.requirementsControl.setValue('');
    this.architectureControl.setValue('');
    this.dataModelControl.setValue('');
    this.apiDesignControl.setValue('');
    this.tradeoffsControl.setValue('');
  }

  private runStaticAnalysis(payload: string) {
    const clean = payload.replace(/\s+/g, ' ').toLowerCase();
    
    const isEmpty = payload.trim().length === 0;
    const isVeryShort = !isEmpty && payload.trim().length < 100;
    
    const hasDataTerms = /\b(sql|nosql|database|db|schema|table|collection|json|key-value|redis|postgres|mongo)\b/.test(clean);
    const hasApiTerms = /\b(api|rest|http|grpc|graphql|endpoint|json|status|payload|request|response)\b/.test(clean);
    const hasArchitectureTerms = /\b(load balancer|cache|service|microservice|monolith|queue|kafka|pubsub|event|worker)\b/.test(clean);
    const hasScalingTerms = /\b(scale|throughput|latency|bottleneck|consistency|availability|cap theorem|sharding|partition)\b/.test(clean);

    return { isEmpty, isVeryShort, hasDataTerms, hasApiTerms, hasArchitectureTerms, hasScalingTerms };
  }

  onSubmit(): void {
    const r = this.requirementsControl.value?.trim() ?? '';
    const a = this.architectureControl.value?.trim() ?? '';
    const d = this.dataModelControl.value?.trim() ?? '';
    const api = this.apiDesignControl.value?.trim() ?? '';
    const t = this.tradeoffsControl.value?.trim() ?? '';

    const payload = [
      '[REQUIREMENTS]',
      r,
      '',
      '[ARCHITECTURE]',
      a,
      '',
      '[DATA_MODEL]',
      d,
      '',
      '[API_DESIGN]',
      api,
      '',
      '[TRADE_OFFS]',
      t
    ].join('\n');

    const analysis = this.runStaticAnalysis(payload);

    const finalSubmission = [
      payload,
      '',
      '[STATIC_ANALYSIS]',
      `isEmpty: ${analysis.isEmpty}`,
      `isVeryShort: ${analysis.isVeryShort}`,
      `hasDataTerms: ${analysis.hasDataTerms}`,
      `hasApiTerms: ${analysis.hasApiTerms}`,
      `hasArchitectureTerms: ${analysis.hasArchitectureTerms}`,
      `hasScalingTerms: ${analysis.hasScalingTerms}`,
    ].join('\n');

    this.answerSubmitted.emit(finalSubmission);

    const key = this.draftKey();
    if (key) {
      try { localStorage.removeItem(key); } catch { }
    }
    this.clearInputs();
  }
}
