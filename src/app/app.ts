import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { InterviewStateService } from './features/interview-workspace/services/interview-state.service';
import { SetupPageComponent } from './features/interview-setup/setup-page.component';
import { InterviewShellComponent } from './features/interview-workspace/interview-shell.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, SetupPageComponent, InterviewShellComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  readonly state = inject(InterviewStateService);

  ngOnInit(): void {
    const snapshot = this.state.loadSessionSnapshot();
    if (snapshot) {
      void this.state.restoreSession(snapshot.userId, snapshot.sessionId);
    }
  }
}
