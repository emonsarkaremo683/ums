import { Component, signal, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CrudService } from '../../../core/services/crud.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface Circular {
  id: number; title: string; session: string; facultyId: number; facultyName: string;
  registrationStartDate: string; registrationEndDate: string;
  applicationFee: number; totalSeats: number; active: boolean;
}
interface Department { id: number; name: string; code: string; facultyId: number; }

@Component({
  selector: 'app-apply',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="page">
      <div class="page-inner">
        @if (!auth.isLoggedIn()) {
          <div class="auth-required animate-fade-in-up">
            <div class="auth-card">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" stroke="currentColor" stroke-width="1.5"/><path d="M7 11V7a5 5 0 0110 0v4" stroke="currentColor" stroke-width="1.5"/></svg>
              <h2>Sign In Required</h2>
              <p>You need to sign in to apply for admission. If you don't have an account, create one first.</p>
              <div class="auth-actions">
                <a routerLink="/login" class="btn btn-gold">Sign In</a>
                <a routerLink="/register" class="btn btn-ghost">Create Account</a>
              </div>
            </div>
          </div>
        } @else if (submitted()) {
          <div class="success-state animate-fade-in-up">
            <div class="success-card">
              <div class="success-icon">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none"><path d="M22 11.08V12a10 10 0 11-5.93-9.14" stroke="currentColor" stroke-width="1.5"/><polyline points="22 4 12 14.01 9 11.01" stroke="currentColor" stroke-width="1.5"/></svg>
              </div>
              <h2>Application Submitted</h2>
              <p>Your application has been submitted successfully. You will receive your application number shortly.</p>
              <div class="success-actions">
                <a routerLink="/" class="btn btn-gold">Back to Home</a>
              </div>
            </div>
          </div>
        } @else if (circular()) {
          <div class="apply-layout animate-fade-in-up">
            <div class="apply-sidebar">
              <a routerLink="/circulars" class="back-link">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19 12H5M12 19l-7-7 7-7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                Back to Circulars
              </a>
              <div class="circular-info">
                <h2>{{ circular()!.title }}</h2>
                <p class="info-meta">{{ circular()!.facultyName }}</p>
                <div class="status-badge">
                  @if (registrationStatus() === 'active') {
                    <span class="badge badge-success">Active</span>
                  } @else if (registrationStatus() === 'closed') {
                    <span class="badge badge-danger">Registration Closed</span>
                  } @else {
                    <span class="badge badge-warning">Inactive</span>
                  }
                </div>
                <div class="info-details">
                  <div class="info-row"><span class="info-label">Session</span><span class="info-value">{{ circular()!.session }}</span></div>
                  <div class="info-row"><span class="info-label">Seats</span><span class="info-value">{{ circular()!.totalSeats }}</span></div>
                  <div class="info-row"><span class="info-label">Fee</span><span class="info-value">{{ circular()!.applicationFee }} BDT</span></div>
                  <div class="info-row"><span class="info-label">Deadline</span><span class="info-value">{{ circular()!.registrationEndDate }}</span></div>
                </div>
              </div>
            </div>

            <div class="apply-form-card">
              @if (!isRegistrationOpen()) {
                <div class="alert alert-warning">Registration for this circular has closed. You cannot submit a new application.</div>
              }
              <h2 class="form-title">Application Form</h2>
              <form class="apply-form" (ngSubmit)="submit()">
                <div class="form-section">
                  <h3 class="section-title">Personal Information</h3>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">First Name <span class="req">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="form.firstName" name="firstName" required placeholder="First name">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Middle Name</label>
                      <input type="text" class="form-control" [(ngModel)]="form.middleName" name="middleName" placeholder="Middle name">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Last Name <span class="req">*</span></label>
                      <input type="text" class="form-control" [(ngModel)]="form.lastName" name="lastName" required placeholder="Last name">
                    </div>
                  </div>
                  <div class="form-row">
                    <div class="form-group">
                      <label class="form-label">Phone <span class="req">*</span></label>
                      <input type="tel" class="form-control" [(ngModel)]="form.phone" name="phone" required placeholder="+8801XXXXXXXXX">
                    </div>
                    <div class="form-group">
                      <label class="form-label">Gender <span class="req">*</span></label>
                      <select class="form-select" [(ngModel)]="form.gender" name="gender" required>
                        <option value="">Select gender</option>
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div class="form-group">
                      <label class="form-label">Date of Birth <span class="req">*</span></label>
                      <input type="date" class="form-control" [(ngModel)]="form.dateOfBirth" name="dateOfBirth" required>
                    </div>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Address</label>
                    <input type="text" class="form-control" [(ngModel)]="form.address" name="address" placeholder="Your address">
                  </div>
                </div>

                <div class="form-section">
                  <h3 class="section-title">Department Preference</h3>
                  <div class="form-group">
                    <label class="form-label">Preferred Department</label>
                    <select class="form-select" [(ngModel)]="form.preferredDepartmentId" name="preferredDepartmentId">
                      <option [ngValue]="null">Select department (optional)</option>
                      @for (dept of departments(); track dept.id) {
                        <option [ngValue]="dept.id">{{ dept.name }} ({{ dept.code }})</option>
                      }
                    </select>
                  </div>
                </div>

                <div class="form-footer">
                  <button type="submit" class="btn btn-gold" [disabled]="!isValid() || saving() || !isRegistrationOpen()">
                    @if (saving()) {
                      <span class="spinner-sm"></span> Submitting...
                    } @else {
                      Submit Application
                    }
                  </button>
                </div>
              </form>
            </div>
          </div>
        } @else if (loading()) {
          <div class="loading-state">
            <div class="skeleton-card" style="height:400px"></div>
          </div>
        } @else {
          <div class="error-state animate-fade-in-up">
            <h2>Circular Not Found</h2>
            <p>The admission circular you're looking for doesn't exist or is no longer active.</p>
            <a routerLink="/circulars" class="btn btn-gold">View All Circulars</a>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .page { padding: 3rem 2rem 5rem; }
    .page-inner { max-width: 1100px; margin: 0 auto; }

    .auth-required, .success-state, .error-state {
      display: flex;
      justify-content: center;
      padding: 4rem 0;
    }
    .auth-card, .success-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-lg);
      padding: 3rem;
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    .auth-card svg, .success-icon svg {
      color: var(--color-gold);
      margin-bottom: 1.5rem;
    }
    .success-icon svg { color: var(--color-success); }
    .auth-card h2, .success-card h2, .error-state h2 {
      font-family: var(--font-display);
      font-size: var(--fs-h2);
      margin-bottom: 0.75rem;
    }
    .auth-card p, .success-card p, .error-state p {
      color: var(--color-text-secondary);
      font-size: var(--fs-small);
      line-height: 1.6;
      margin-bottom: 1.5rem;
    }
    .auth-actions, .success-actions {
      display: flex;
      gap: 0.75rem;
      justify-content: center;
    }
    .loading-state { display: flex; justify-content: center; padding: 4rem 0; }

    .apply-layout {
      display: grid;
      grid-template-columns: 300px 1fr;
      gap: 2rem;
      align-items: start;
    }
    .apply-sidebar {
      position: sticky;
      top: 80px;
    }
    .back-link {
      display: inline-flex;
      align-items: center;
      gap: 0.375rem;
      font-size: var(--fs-small);
      color: var(--color-text-muted);
      text-decoration: none;
      margin-bottom: 1.5rem;
      transition: color var(--duration-fast) var(--ease-out);
    }
    .back-link:hover { color: var(--color-gold); }
    .circular-info {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.5rem;
    }
    .circular-info h2 {
      font-family: var(--font-display);
      font-size: var(--fs-h3);
      margin: 0.75rem 0 0.25rem;
    }
    .info-meta {
      font-size: var(--fs-small);
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }
    .info-details {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .info-row {
      display: flex;
      justify-content: space-between;
      font-size: var(--fs-small);
    }
    .info-label { color: var(--color-text-muted); }
    .info-value { font-weight: var(--fw-semibold); color: var(--color-text-primary); }

    .apply-form-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 2rem;
    }
    .form-title {
      font-family: var(--font-display);
      font-size: var(--fs-h2);
      margin-bottom: 1.5rem;
    }
    .apply-form {
      display: flex;
      flex-direction: column;
      gap: 2rem;
    }
    .form-section {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: var(--fs-h3);
      padding-bottom: 0.75rem;
      border-bottom: 1px solid var(--color-border);
    }
    .form-row {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
      gap: 1rem;
    }
    .form-group {
      display: flex;
      flex-direction: column;
    }
    .form-label {
      margin-bottom: 0.375rem;
    }
    .req { color: var(--color-danger); }
    .form-footer {
      display: flex;
      justify-content: flex-end;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }
    .error-state .btn { margin-top: 0.5rem; }

    @media (max-width: 768px) {
      .apply-layout { grid-template-columns: 1fr; }
      .apply-sidebar { position: static; }
    }
  `],
})
export class ApplyComponent implements OnInit {
  circular = signal<Circular | null>(null);
  departments = signal<Department[]>([]);
  loading = signal(true);
  saving = signal(false);
  submitted = signal(false);
  circularId = 0;

  form: any = {
    firstName: '', middleName: '', lastName: '',
    phone: '', gender: '', dateOfBirth: '',
    address: '', circularId: 0, preferredDepartmentId: null,
  };

  isRegistrationOpen() {
    const circular = this.circular();
    if (!circular) return false;
    if (!circular.active) return false;
    const today = new Date();
    const endDate = new Date(circular.registrationEndDate);
    return today <= endDate;
  }

  registrationStatus(): string {
    const circular = this.circular();
    if (!circular) return 'unknown';
    if (!circular.active) return 'inactive';
    const today = new Date();
    const endDate = new Date(circular.registrationEndDate);
    return today <= endDate ? 'active' : 'closed';
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public auth: AuthService,
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    if (!this.auth.isLoggedIn()) return;

    this.circularId = Number(this.route.snapshot.paramMap.get('id'));
    this.form.circularId = this.circularId;

    this.crud.getById<Circular>('admission-circulars', this.circularId).subscribe({
      next: (c) => {
        this.circular.set(c);
        this.loading.set(false);
        if (c.facultyId) {
          this.crud.listAll<Department>(`departments/faculty/${c.facultyId}`).subscribe({
            next: (d) => this.departments.set(d),
          });
        }
      },
      error: () => this.loading.set(false),
    });
  }

  isValid(): boolean {
    return this.form.firstName && this.form.lastName && this.form.phone &&
           this.form.gender && this.form.dateOfBirth && this.form.circularId > 0;
  }

  submit(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    this.crud.create<any, any>('applicants', this.form).subscribe({
      next: () => {
        this.toast.success('Application submitted successfully!');
        this.submitted.set(true);
        this.saving.set(false);
      },
      error: (err) => {
        this.saving.set(false);
        this.toast.error(err?.error?.message || 'Failed to submit application');
      },
    });
  }
}
