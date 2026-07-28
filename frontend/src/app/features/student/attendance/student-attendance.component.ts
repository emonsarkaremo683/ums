import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { CrudService } from '../../../core/services/crud.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface AttendanceRecord {
  id: number;
  studentId: number;
  studentName: string;
  date: string;
  checkInTime: string;
  checkOutTime: string;
  status: string;
}

@Component({
  selector: 'app-student-attendance',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Attendance History" subtitle="View your attendance records" />

      <div class="card card-elevated animate-fade-in-up stagger-1">
        <div class="card-header"><h3>Filter by Date Range</h3></div>
        <div class="card-body">
          <div class="filter-row">
            <div class="form-group">
              <label class="form-label">Start Date</label>
              <input type="date" class="form-control" [(ngModel)]="startDate" (change)="loadRecords()">
            </div>
            <div class="form-group">
              <label class="form-label">End Date</label>
              <input type="date" class="form-control" [(ngModel)]="endDate" (change)="loadRecords()">
            </div>
          </div>
        </div>
      </div>

      <div class="card card-elevated animate-fade-in-up stagger-2" style="margin-top:1.5rem">
        <div class="card-body">
          @if (loading()) {
            <div class="empty-state"><p>Loading attendance records...</p></div>
          } @else if (records().length > 0) {
            <div class="summary-row">
              <div class="summary-item">
                <span class="summary-label">Total Days</span>
                <span class="summary-value">{{ records().length }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Present</span>
                <span class="summary-value text-success">{{ presentCount() }}</span>
              </div>
              <div class="summary-item">
                <span class="summary-label">Late</span>
                <span class="summary-value text-warning">{{ lateCount() }}</span>
              </div>
            </div>

            <table class="table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (r of records(); track r.id) {
                  <tr>
                    <td>{{ r.date }}</td>
                    <td>{{ r.checkInTime || '--' }}</td>
                    <td>{{ r.checkOutTime || '--' }}</td>
                    <td>
                      <span class="badge" [class]="'badge-' + r.status.toLowerCase()">{{ r.status }}</span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <div class="empty-state"><p>No attendance records found for this period.</p></div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 900px; }
    .filter-row { display: flex; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; flex: 1; max-width: 250px; }
    .form-label { margin-bottom: 0.375rem; }
    .summary-row { display: flex; gap: 2rem; margin-bottom: 1.5rem; padding-bottom: 1rem; border-bottom: 1px solid var(--color-border); }
    .summary-item { display: flex; flex-direction: column; gap: 0.25rem; }
    .summary-label { font-size: var(--fs-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .summary-value { font-size: 1.25rem; font-weight: var(--fw-bold); color: var(--color-text-primary); }
    .text-success { color: #10b981; }
    .text-warning { color: #f59e0b; }
    .badge { padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: var(--fw-semibold); }
    .badge-present { background: rgba(16,185,129,0.12); color: #10B981; }
    .badge-late { background: rgba(245,158,11,0.12); color: #F59E0B; }
    .badge-absent { background: rgba(239,68,68,0.12); color: #EF4444; }
    .table { --bs-table-bg: transparent; --bs-table-color: var(--color-text-primary); --bs-table-border-color: var(--color-border); width: 100%; margin-bottom: 0;
      thead th { font-weight: var(--fw-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--fs-xs); padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); }
      tbody td { padding: 0.75rem 1rem; font-size: var(--fs-small); border-bottom: 1px solid var(--color-border); }
    }
    .empty-state { text-align: center; padding: 2rem; color: var(--color-text-muted); font-size: var(--fs-small); }
  `],
})
export class StudentAttendanceComponent implements OnInit {
  records = signal<AttendanceRecord[]>([]);
  loading = signal(false);
  startDate = '';
  endDate = '';

  presentCount = signal(0);
  lateCount = signal(0);

  constructor(
    private crud: CrudService,
    private auth: AuthService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.startDate = this.formatDate(firstDay);
    this.endDate = this.formatDate(now);
    this.loadRecords();
  }

  loadRecords(): void {
    this.loading.set(true);
    const userId = this.auth.getUserId();
    if (!userId) {
      this.loading.set(false);
      return;
    }

    const params = new URLSearchParams();
    params.set('studentId', String(userId));
    if (this.startDate) params.set('start', this.startDate);
    if (this.endDate) params.set('end', this.endDate);

    this.crud.listAll<AttendanceRecord>(`student/attendance?${params.toString()}`).subscribe({
      next: (data) => {
        this.records.set(data || []);
        this.presentCount.set((data || []).filter(r => r.status === 'PRESENT').length);
        this.lateCount.set((data || []).filter(r => r.status === 'LATE').length);
        this.loading.set(false);
      },
      error: () => {
        this.toast.error('Failed to load attendance records');
        this.loading.set(false);
      },
    });
  }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
