import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SessionFeedbackComponent } from './features/feedback/session-feedback.component';
import { authGuard } from './core/auth/auth.guard';
import { AuthPageComponent } from './features/auth/auth-page.component';

export const routes: Routes = [
  { path: 'login', component: AuthPageComponent },
  { path: 'register', component: AuthPageComponent },
  { path: '', component: DashboardComponent, canActivate: [authGuard] },
  {
    path: 'interview/:id',
    loadComponent: () =>
      import('./features/interview-workspace/interview-shell.component').then(
        (m) => m.InterviewShellComponent,
      ),
    canActivate: [authGuard],
  },
  {
    path: 'interview/:id/feedback',
    component: SessionFeedbackComponent,
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: '' },
];
