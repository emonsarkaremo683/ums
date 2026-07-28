import { Component, ViewChild, signal } from '@angular/core';
import { FaceCaptureComponent } from '../../../shared/components/face-capture/face-capture.component';
import { FaceService } from '../../../core/services/face.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-student-face',
  standalone: true,
  imports: [FaceCaptureComponent],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">Face Verification</h1>
          <p class="page-subtitle">Enroll your face and attend classes with face verification</p>
        </div>
        <div class="status-badge" [class.enrolled]="isEnrolled()">
          @if (isEnrolled()) {
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5"/>
              <path d="M5 8.5l2 2 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Enrolled
          } @else {
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" stroke-dasharray="3 3"/>
              <path d="M8 5v3M8 10v1" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
            Not Enrolled
          }
        </div>
      </div>

      @if (!isEnrolled()) {
        <div class="card card-elevated animate-fade-in-up stagger-1">
          <div class="card-header">
            <h3>Step 1: Enroll Your Face</h3>
            <p>Position your face in the center of the frame and click capture</p>
          </div>
          <div class="card-body">
            <app-face-capture (captured)="onEnroll($event)" #enrollCapture />
          </div>
        </div>
      } @else {
        <div class="card card-elevated animate-fade-in-up stagger-1">
          <div class="card-header">
            <h3>Check In</h3>
            <p>Verify your face to mark your attendance</p>
          </div>
          <div class="card-body">
            <app-face-capture (captured)="onCheckIn($event)" #checkInCapture />
          </div>
        </div>
      }

      @if (resultMessage()) {
        <div class="result-card animate-fade-in-up" [class.success]="resultSuccess()">
          <div class="result-icon">
            @if (resultSuccess()) {
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                <path d="M10 17l4 4 8-8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            } @else {
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="currentColor" stroke-width="2"/>
                <path d="M12 12l8 8M20 12l-8 8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
              </svg>
            }
          </div>
          <p>{{ resultMessage() }}</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 800px; }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 2rem;
    }
    .page-title { font-family: var(--font-display); font-size: var(--fs-h1); margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--color-text-muted); font-size: var(--fs-small); }

    .status-badge {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      border-radius: var(--radius-sm);
      font-size: var(--fs-small);
      font-weight: var(--fw-medium);
      background: var(--color-surface-elevated);
      color: var(--color-text-muted);
      border: 1px solid var(--color-border);

      &.enrolled {
        color: var(--color-success, #22c55e);
        border-color: var(--color-success, #22c55e);
        background: rgba(34, 197, 94, 0.1);
      }
    }

    .card { border-radius: var(--radius-lg); }
    .card-header {
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid var(--color-border);

      h3 { font-family: var(--font-display); font-size: 1.125rem; margin-bottom: 0.25rem; }
      p { color: var(--color-text-muted); font-size: var(--fs-xs); }
    }
    .card-body {
      padding: 1.5rem;
      display: flex;
      justify-content: center;
    }

    .result-card {
      margin-top: 1.5rem;
      padding: 1.25rem;
      border-radius: var(--radius-md);
      display: flex;
      align-items: center;
      gap: 1rem;
      background: var(--color-surface-elevated);
      border: 1px solid var(--color-border);

      &.success {
        border-color: var(--color-success, #22c55e);
        background: rgba(34, 197, 94, 0.05);
        color: var(--color-success, #22c55e);
      }

      &:not(.success) {
        border-color: var(--color-danger, #ef4444);
        background: rgba(239, 68, 68, 0.05);
        color: var(--color-danger, #ef4444);
      }
    }

    .result-icon { flex-shrink: 0; }
  `],
})
export class StudentFaceComponent {
  @ViewChild('enrollCapture') enrollCapture!: FaceCaptureComponent;
  @ViewChild('checkInCapture') checkInCapture!: FaceCaptureComponent;

  isEnrolled = signal(false);
  resultMessage = signal<string | null>(null);
  resultSuccess = signal(false);

  constructor(
    private faceService: FaceService,
    private toast: ToastService,
  ) {
    this.loadStatus();
  }

  loadStatus() {
    this.faceService.getStudentFaceStatus().subscribe({
      next: (res) => {
        if (res.success) {
          this.isEnrolled.set(res.data.enrolled);
        }
      },
      error: () => {
        this.toast.error('Failed to load enrollment status');
      },
    });
  }

  onEnroll(base64: string) {
    this.faceService.enrollStudentSelf(base64).subscribe({
      next: (res) => {
        if (res.success) {
          this.toast.success('Face enrolled successfully!');
          this.isEnrolled.set(true);
          this.resultMessage.set('Face enrolled! You can now use face verification for attendance.');
          this.resultSuccess.set(true);
          this.enrollCapture?.setProcessing(false);
        }
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Face enrollment failed');
        this.enrollCapture?.setProcessing(false);
      },
    });
  }

  onCheckIn(base64: string) {
    this.faceService.verifyStudentCheckIn(base64).subscribe({
      next: (res) => {
        if (res.success && res.data.matched) {
          this.toast.success(`Attendance marked! Welcome, ${res.data.studentName}`);
          this.resultMessage.set(`Checked in — ${res.data.studentName} (confidence: ${(res.data.confidence * 100).toFixed(1)}%)`);
          this.resultSuccess.set(true);
        } else {
          this.resultMessage.set(res.data?.message || 'Face not recognized');
          this.resultSuccess.set(false);
        }
        this.checkInCapture?.setProcessing(false);
      },
      error: (err) => {
        this.toast.error(err?.error?.message || 'Face verification failed');
        this.checkInCapture?.setProcessing(false);
      },
    });
  }
}
