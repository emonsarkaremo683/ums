import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface StudentProfile {
  id: number;
  name: string;
  registrationNumber: string;
  departmentName: string;
  facultyName: string;
}

interface YearResult {
  yearLevelName: string;
  cgpa: number;
  totalCredits: number;
  status: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="page animate-fade-in-up">
      <div class="page-header">
        <div>
          <h1 class="page-title">Student Dashboard</h1>
          <p class="page-subtitle">Welcome, {{ auth.currentUserEmail() }}</p>
        </div>
      </div>

      <div class="welcome-card animate-fade-in-up stagger-1">
        <div class="welcome-content">
          <h2>Your Academic Journey</h2>
          <p>View your profile, results, and academic progress here.</p>
        </div>
        <div class="welcome-deco">
          <svg width="80" height="80" viewBox="0 0 80 80" fill="none" opacity="0.15">
            <path d="M40 10L70 30V50L40 70L10 50V30L40 10Z" stroke="var(--color-gold)" stroke-width="2"/>
            <path d="M40 20L60 33V47L40 60L20 47V33L40 20Z" stroke="var(--color-gold)" stroke-width="1.5"/>
          </svg>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card animate-fade-in-up stagger-2">
          <span class="stat-label">CGPA</span>
          <span class="stat-value">{{ latestCgpa() || '--' }}</span>
        </div>
        <div class="stat-card animate-fade-in-up stagger-3">
          <span class="stat-label">Total Credits</span>
          <span class="stat-value">{{ completedCourses() }}</span>
        </div>
        <div class="stat-card animate-fade-in-up stagger-4">
          <span class="stat-label">Registration No.</span>
          <span class="stat-value" style="font-size: 1rem">{{ profile()?.registrationNumber || '--' }}</span>
        </div>
      </div>

      <div class="content-grid">
        <div class="card card-elevated animate-fade-in-up stagger-3">
          <div class="card-header"><h3>Quick Links</h3></div>
          <div class="card-body">
            <div class="quick-actions">
              <a class="quick-action" routerLink="/student/results">
                <span>View Results</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </a>
              <a class="quick-action" routerLink="/student/profile">
                <span>My Profile</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </a>
              <a class="quick-action" routerLink="/student/face">
                <span>Face Verification</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </a>
              <a class="quick-action" routerLink="/student/attendance">
                <span>Attendance</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </a>
            </div>
          </div>
        </div>

        <div class="card card-elevated animate-fade-in-up stagger-4">
          <div class="card-header"><h3>Academic Info</h3></div>
          <div class="card-body">
            @if (profile()) {
              <div class="info-list">
                <div class="info-item">
                  <span class="info-label">Name</span>
                  <span class="info-value">{{ profile()!.name }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Faculty</span>
                  <span class="info-value">{{ profile()!.facultyName || '--' }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">Department</span>
                  <span class="info-value">{{ profile()!.departmentName || '--' }}</span>
                </div>
              </div>
            } @else {
              <div class="empty-state"><p>Loading profile...</p></div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { margin-bottom: 2rem; }
    .page-title { font-family: var(--font-display); font-size: var(--fs-h1); margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--color-text-muted); font-size: var(--fs-small); }

    .welcome-card {
      background: linear-gradient(135deg, var(--color-surface-elevated), var(--color-surface));
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 2rem;
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      h2 { font-family: var(--font-display); font-size: var(--fs-h2); margin-bottom: 0.5rem; }
      p { color: var(--color-text-secondary); font-size: var(--fs-small); }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
      margin-bottom: 2rem;
    }

    .stat-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }
    .stat-label { font-size: var(--fs-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .stat-value { font-size: 2rem; font-weight: var(--fw-bold); color: var(--color-gold); }

    .content-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }

    .quick-actions { display: flex; flex-direction: column; gap: 0.5rem; }
    .quick-action {
      display: flex; align-items: center; justify-content: space-between;
      padding: 0.75rem; border-radius: var(--radius-sm);
      color: var(--color-text-secondary); text-decoration: none;
      transition: all var(--duration-fast) var(--ease-out);
      &:hover { background: var(--color-surface-elevated); color: var(--color-gold); }
    }

    .info-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .info-item { display: flex; justify-content: space-between; align-items: center; padding: 0.5rem 0; border-bottom: 1px solid var(--color-border); }
    .info-label { font-size: var(--fs-small); color: var(--color-text-muted); }
    .info-value { font-size: var(--fs-small); color: var(--color-text-primary); font-weight: var(--fw-medium); }

    .empty-state { text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: var(--fs-small); }

    @media (max-width: 768px) { .content-grid { grid-template-columns: 1fr; } }
  `],
})
export class StudentDashboardComponent implements OnInit {
  profile = signal<StudentProfile | null>(null);
  yearResults = signal<YearResult[]>([]);

  latestCgpa = signal<string>('');
  completedCourses = signal(0);

  constructor(
    public auth: AuthService,
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    const userId = this.auth.getUserId();
    if (!userId) return;

    this.crud.getById<StudentProfile>('students/user', userId).subscribe({
      next: (data) => {
        this.profile.set(data);
        this.loadYearResults(data.id);
      },
      error: () => { this.toast.error('Failed to load profile'); },
    });
  }

  loadYearResults(studentId: number): void {
    this.crud.listAll<YearResult>(`year-results/student/${studentId}`).subscribe({
      next: (data) => {
        this.yearResults.set(data || []);
        if (data && data.length > 0) {
          const latest = data[data.length - 1];
          this.latestCgpa.set(latest.cgpa?.toFixed(2) || '');
          this.completedCourses.set(data.reduce((sum, r) => sum + (r.totalCredits || 0), 0));
        }
      },
      error: () => { this.toast.error('Failed to load year results'); },
    });
  }
}
