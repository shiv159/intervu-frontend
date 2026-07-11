import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center px-4">
      <div class="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl">
        <p class="text-xs uppercase tracking-[0.3em] text-gray-500 mb-3">Intervu</p>
        <h1 class="text-3xl font-bold mb-2">{{ title() }}</h1>
        <p class="text-gray-400 mb-8">{{ subtitle() }}</p>

        <form class="space-y-4" [formGroup]="form" (ngSubmit)="submit()">
          <label class="block">
            <span class="block text-sm text-gray-300 mb-1">Email</span>
            <input type="email" formControlName="email" class="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500" />
          </label>

          <label class="block">
            <span class="block text-sm text-gray-300 mb-1">Password</span>
            <input type="password" formControlName="password" class="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-2 focus:outline-none focus:border-gray-500" />
          </label>

          @if (error()) {
            <p class="text-sm text-red-400">{{ error() }}</p>
          }

          <button type="submit" class="w-full bg-white text-gray-950 font-semibold py-2.5 rounded-lg disabled:opacity-60" [disabled]="submitting() || form.invalid">
            {{ submitting() ? 'Submitting...' : title() }}
          </button>
        </form>

        <p class="mt-6 text-sm text-gray-400">
          @if (isLogin()) {
            New here?
            <a routerLink="/register" class="text-white underline">Create account</a>
          } @else {
            Already have account?
            <a routerLink="/login" class="text-white underline">Sign in</a>
          }
        </p>
      </div>
    </div>
  `,
})
export class AuthPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly submitting = signal(false);
  readonly error = signal('');
  readonly isLogin = computed(() => this.route.snapshot.routeConfig?.path !== 'register');
  readonly title = computed(() => this.isLogin() ? 'Sign In' : 'Create Account');
  readonly subtitle = computed(() => this.isLogin()
    ? 'Use your account to access interview sessions.'
    : 'Create an account to start and save interview sessions.');

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  async submit(): Promise<void> {
    if (this.form.invalid || this.submitting()) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);
    this.error.set('');
    try {
      const { email, password } = this.form.getRawValue();
      if (this.isLogin()) {
        await this.authService.login(email, password);
      } else {
        await this.authService.register(email, password);
      }
      const redirectTo = this.route.snapshot.queryParamMap.get('redirectTo') || '/';
      await this.router.navigateByUrl(redirectTo);
    } catch (error) {
      this.error.set(this.formatError(error));
    } finally {
      this.submitting.set(false);
    }
  }

  private formatError(error: unknown): string {
    if (error && typeof error === 'object' && 'message' in error) {
      return String((error as { message: unknown }).message);
    }
    return 'Authentication failed.';
  }
}
