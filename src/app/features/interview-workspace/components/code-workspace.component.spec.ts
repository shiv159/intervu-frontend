import { TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { signal } from '@angular/core';
import { CodeWorkspaceComponent } from './code-workspace.component';
import { InterviewStateService } from '../services/interview-state.service';
import { QuestionPayload } from '../../../core/models/interview.models';

describe('CodeWorkspaceComponent', () => {
  let component: CodeWorkspaceComponent;
  let stateServiceMock: any;
  let mockQuestion: QuestionPayload;

  beforeEach(async () => {
    mockQuestion = {
      id: 'q1',
      title: 'Test Question',
      prompt: 'Write a function...',
      mode: 'CODE',
      difficulty: 'MEDIUM',
      seniority: 'INTERMEDIATE',
      tags: [],
      expectedConcepts: [],
      rubric: {},
      version: 1
    };

    stateServiceMock = {
      session: signal({
        sessionId: 'session123',
        ownerId: 'owner123',
        targetRole: 'Software Engineer',
        state: 'STARTED',
        mode: 'CODE',
        seniority: 'INTERMEDIATE',
        difficulty: 'MEDIUM',
        stateVersion: 1,
        skills: [],
        focusAreas: [],
        currentQuestion: mockQuestion,
        lastEvaluation: null
      })
    };

    await TestBed.configureTestingModule({
      imports: [ReactiveFormsModule, CodeWorkspaceComponent],
      providers: [
        { provide: InterviewStateService, useValue: stateServiceMock }
      ]
    }).compileComponents();

    const fixture = TestBed.createComponent(CodeWorkspaceComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('question', mockQuestion);
    fixture.componentRef.setInput('isSubmitting', false);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Static Analysis Recursion Heuristics', () => {
    it('should strip comments before analysis and not detect recursion in comments', () => {
      const code = `
        // helper function factorial
        // def factorial(n):
        //     return factorial(n - 1)
        def solve():
            return 42
      `;
      const analysis = component.runStaticAnalysis(code);
      expect(analysis.hasRecursion).toBe(false);
    });

    it('should detect actual recursion in Python using body-scoping heuristic', () => {
      const code = `
        def factorial(n):
            if n <= 1:
                return 1
            return n * factorial(n - 1)
      `;
      const analysis = component.runStaticAnalysis(code);
      expect(analysis.hasRecursion).toBe(true);
    });

    it('should not detect recursion for helper calls outside the function in Python', () => {
      const code = `
        def factorial(n):
            return 1
        
        # Calling it outside should not be recursion
        val = factorial(5)
      `;
      const analysis = component.runStaticAnalysis(code);
      expect(analysis.hasRecursion).toBe(false);
    });

    it('should detect recursion in brace-based languages (Java/TS/Go)', () => {
      const code = `
        int fib(int n) {
          if (n <= 1) return n;
          return fib(n - 1) + fib(n - 2);
        }
      `;
      const analysis = component.runStaticAnalysis(code);
      expect(analysis.hasRecursion).toBe(true);
    });

    it('should not detect recursion for non-recursive methods in brace-based languages', () => {
      const code = `
        int helper(int n) {
          return n + 1;
        }
        int main() {
          return helper(5);
        }
      `;
      const analysis = component.runStaticAnalysis(code);
      expect(analysis.hasRecursion).toBe(false);
    });
  });

  describe('Draft Persistence and Bleeding Prevention', () => {
    beforeEach(() => {
      localStorage.clear();
    });

    it('should scope draft keys using session and question ID', () => {
      component.codeControl.setValue('my code');
      component.saveDraft();
      const expectedKey = 'intervu.draft.session123.q1';
      const stored = localStorage.getItem(expectedKey);
      expect(stored).toBeTruthy();
      const parsed = JSON.parse(stored || '{}');
      expect(parsed.code).toBe('my code');
    });

    it('should clear input controls if no draft exists to prevent bleeding', () => {
      component.codeControl.setValue('old code');
      component.restoreDraft();
      expect(component.codeControl.value).toBe('');
      expect(component.languageControl.value).toBe('java');
    });

    it('should clear draft from localStorage on submission', () => {
      component.codeControl.setValue('submission code');
      component.saveDraft();
      const expectedKey = 'intervu.draft.session123.q1';
      expect(localStorage.getItem(expectedKey)).toBeTruthy();

      component.onSubmit();
      expect(localStorage.getItem(expectedKey)).toBeNull();
    });
  });

  describe('Disable interactive controls during submission', () => {
    it('should disable controls when isSubmitting is true', () => {
      const fixture = TestBed.createComponent(CodeWorkspaceComponent);
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('isSubmitting', true);
      fixture.detectChanges();

      expect(comp.codeControl.disabled).toBe(true);
      expect(comp.approachControl.disabled).toBe(true);
      expect(comp.languageControl.disabled).toBe(true);
      expect(comp.editorOptions.readOnly).toBe(true);
    });

    it('should enable controls when isSubmitting is false', () => {
      const fixture = TestBed.createComponent(CodeWorkspaceComponent);
      const comp = fixture.componentInstance;
      fixture.componentRef.setInput('question', mockQuestion);
      fixture.componentRef.setInput('isSubmitting', false);
      fixture.detectChanges();

      expect(comp.codeControl.enabled).toBe(true);
      expect(comp.approachControl.enabled).toBe(true);
      expect(comp.languageControl.enabled).toBe(true);
      expect(comp.editorOptions.readOnly).toBe(false);
    });
  });
});
