import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard.component';
import { SessionFeedbackComponent } from './features/feedback/session-feedback.component';

export const routes: Routes = [
  { path: '', component: DashboardComponent },
  {
    path: 'interview/:id',
    loadComponent: () =>
      import('./features/interview-workspace/interview-shell.component').then(
        (m) => m.InterviewShellComponent,
      ),
  },
  {
    path: 'interview/:id/feedback',
    component: SessionFeedbackComponent,
  },
  { path: '**', redirectTo: '' },
];