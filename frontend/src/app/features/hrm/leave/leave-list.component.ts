import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface LeaveRequest {
  id: number; employeeId: number; employeeName: string; leaveTypeName: string;
  startDate: string; endDate: string; totalDays: number; reason: string; status: string;
}

interface LeaveType { id: number; name: string; defaultDaysPerYear: number; paid: boolean; }
interface Employee { id: number; firstName: string; lastName: string; }

@Component({
  selector: 'app-leave-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header title="Leave Requests" subtitle="Manage employee leave applications">
      <button class="btn btn-gold" (click)="openModal()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Request Leave
      </button>
    </app-page-header>

    <div class="filter-bar animate-fade-in-up stagger-1">
      <div class="filter-group">
        <label class="form-label">Status</label>
        <select class="form-select form-select-sm" [(ngModel)]="statusFilter" (change)="loadPage(0)">
          <option value="">All</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>
    </div>

    <div class="card card-elevated animate-fade-in-up stagger-2">
      <div class="card-body">
        @if (loading()) {
          <div class="empty-state"><p>Loading...</p></div>
        } @else if (rows().length === 0) {
          <div class="empty-state">
            <p class="empty-title">No leave requests</p>
            <p class="empty-subtitle">Leave requests will appear here.</p>
          </div>
        } @else {
          <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Type</th>
                  <th>Start</th>
                  <th>End</th>
                  <th style="text-align:center">Days</th>
                  <th>Reason</th>
                  <th style="text-align:center">Status</th>
                  <th style="text-align:center;width:160px">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr>
                    <td>{{ row.employeeName }}</td>
                    <td>{{ row.leaveTypeName }}</td>
                    <td>{{ row.startDate }}</td>
                    <td>{{ row.endDate }}</td>
                    <td style="text-align:center">{{ row.totalDays }}</td>
                    <td>{{ row.reason || '--' }}</td>
                    <td style="text-align:center">
                      <span class="badge" [class]="'badge-' + row.status.toLowerCase()">{{ row.status }}</span>
                    </td>
                    <td style="text-align:center">
                      @if (row.status === 'PENDING') {
                        <button class="btn btn-ghost btn-sm text-success" (click)="approveLeave(row); $event.stopPropagation()">Approve</button>
                        <button class="btn btn-ghost btn-sm text-danger" (click)="rejectLeave(row); $event.stopPropagation()">Reject</button>
                      } @else {
                        <span class="text-muted">--</span>
                      }
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          @if (totalPages() > 1) {
            <div class="table-footer">
              <span class="table-info">Page {{ currentPage() + 1 }} of {{ totalPages() }} ({{ totalElements() }} total)</span>
              <div class="table-pagination">
                <button class="btn btn-ghost btn-sm" (click)="loadPage(currentPage() - 1)" [disabled]="currentPage() === 0">&laquo;</button>
                @for (p of visiblePages(); track p) {
                  <button class="btn btn-sm" [class.btn-gold]="p === currentPage()" [class.btn-ghost]="p !== currentPage()" (click)="loadPage(p)">{{ p + 1 }}</button>
                }
                <button class="btn btn-ghost btn-sm" (click)="loadPage(currentPage() + 1)" [disabled]="currentPage() >= totalPages() - 1">&raquo;</button>
              </div>
            </div>
          }
        }
      </div>
    </div>

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Request Leave</h2>
            <button class="btn-close" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <form class="modal-body" (ngSubmit)="save()">
            <div class="form-group">
              <label class="form-label">Employee <span class="req">*</span></label>
              <select class="form-select" [(ngModel)]="form.employeeId" name="employeeId" required>
                <option [ngValue]="0">Select employee</option>
                @for (e of employees(); track e.id) {
                  <option [ngValue]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Leave Type <span class="req">*</span></label>
              <select class="form-select" [(ngModel)]="form.leaveTypeId" name="leaveTypeId" required>
                <option [ngValue]="0">Select type</option>
                @for (lt of leaveTypes(); track lt.id) {
                  <option [ngValue]="lt.id">{{ lt.name }}</option>
                }
              </select>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Start Date <span class="req">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.startDate" name="startDate" required>
              </div>
              <div class="form-group">
                <label class="form-label">End Date <span class="req">*</span></label>
                <input type="date" class="form-control" [(ngModel)]="form.endDate" name="endDate" required>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Reason</label>
              <textarea class="form-control" [(ngModel)]="form.reason" name="reason" rows="3" placeholder="Optional reason for leave"></textarea>
            </div>
            <div class="modal-footer">
              <div class="footer-spacer"></div>
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" [disabled]="!isValid() || saving()">{{ saving() ? 'Submitting...' : 'Submit Request' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (confirmAction()) {
      <app-confirm-dialog
        [title]="confirmAction()!.action === 'approve' ? 'Approve Leave' : 'Reject Leave'"
        [message]="'Are you sure you want to ' + confirmAction()!.action + ' this leave request for ' + confirmAction()!.record.employeeName + '?'"
        [confirmLabel]="confirmAction()!.action === 'approve' ? 'Approve' : 'Reject'"
        [type]="confirmAction()!.action === 'approve' ? 'info' : 'danger'"
        (confirm)="doAction()"
        (cancel)="confirmAction.set(null)"
      />
    }
  `,
  styles: [`
    :host { display: block; max-width: 1200px; }
    .filter-bar { display: flex; gap: 1rem; margin-bottom: 1.5rem; }
    .filter-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.25rem; font-size: var(--fs-xs); color: var(--color-text-muted); text-transform: uppercase; letter-spacing: 0.06em; }
    .form-select-sm { max-width: 180px; }

    .table-scroll { overflow-x: auto; }
    .table { --bs-table-bg: transparent; --bs-table-color: var(--color-text-primary); --bs-table-border-color: var(--color-border); width: 100%; margin-bottom: 0;
      thead th { font-weight: var(--fw-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--fs-xs); letter-spacing: 0.06em; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
      tbody td { padding: 0.75rem 1rem; font-size: var(--fs-small); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
      tbody tr { transition: background-color 0.15s; &:hover { background-color: var(--color-surface-elevated); } }
    }

    .badge { padding: 0.2rem 0.6rem; border-radius: var(--radius-sm); font-size: var(--fs-xs); font-weight: var(--fw-semibold); text-transform: uppercase; }
    .badge-pending { background: rgba(245,158,11,0.12); color: #F59E0B; }
    .badge-approved { background: rgba(16,185,129,0.12); color: #10B981; }
    .badge-rejected { background: rgba(239,68,68,0.12); color: #EF4444; }

    .text-success { color: #10B981; }
    .text-danger { color: #EF4444; }
    .text-muted { color: var(--color-text-muted); }

    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-top: 1px solid var(--color-border); }
    .table-info { font-size: var(--fs-small); color: var(--color-text-muted); }
    .table-pagination { display: flex; align-items: center; gap: 0.25rem; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: var(--fs-xs); min-width: 32px; height: 32px; }

    .empty-state { text-align: center; padding: 3rem; }
    .empty-title { font-family: var(--font-display); font-size: var(--fs-h3); color: var(--color-text-secondary); margin-bottom: 0.25rem; }
    .empty-subtitle { font-size: var(--fs-small); color: var(--color-text-muted); }

    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10001; }
    .modal-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 90%; max-width: 520px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.3s var(--ease-spring); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); h2 { font-family: var(--font-display); font-size: var(--fs-h3); } }
    .btn-close { background: none; border: none; color: var(--color-text-muted); padding: 4px; cursor: pointer; &:hover { color: var(--color-text-primary); } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .req { color: var(--color-danger); }
    .modal-footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 1rem; }
    .footer-spacer { flex: 1; }
  `],
})
export class LeaveListComponent implements OnInit {
  rows = signal<LeaveRequest[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  statusFilter = '';

  showModal = signal(false);
  saving = signal(false);
  employees = signal<Employee[]>([]);
  leaveTypes = signal<LeaveType[]>([]);
  form: any = { employeeId: 0, leaveTypeId: 0, startDate: '', endDate: '', reason: '' };

  confirmAction = signal<{ record: LeaveRequest; action: 'approve' | 'reject' } | null>(null);

  visiblePages = signal<number[]>([]);

  constructor(private crud: CrudService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadPage(0);
    this.crud.listAll<Employee>('employees/active').subscribe({
      next: (d) => this.employees.set(d),
      error: () => this.toast.error('Failed to load employees'),
    });
    this.crud.listAll<LeaveType>('leave-requests/leave-types').subscribe({
      next: (d) => this.leaveTypes.set(d),
      error: () => this.toast.error('Failed to load leave types'),
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<LeaveRequest>('leave-requests', page, 10, undefined, this.statusFilter ? { status: this.statusFilter } : undefined).subscribe({
      next: (d) => {
        this.rows.set(d.content);
        this.currentPage.set(d.number);
        this.totalPages.set(d.totalPages);
        this.totalElements.set(d.totalElements);
        this.loading.set(false);
        this.computeVisiblePages();
      },
      error: () => this.loading.set(false),
    });
  }

  computeVisiblePages(): void {
    const pages: number[] = [];
    const max = 5;
    let start = Math.max(0, this.currentPage() - Math.floor(max / 2));
    const end = Math.min(this.totalPages(), start + max);
    start = Math.max(0, end - max);
    for (let i = start; i < end; i++) pages.push(i);
    this.visiblePages.set(pages);
  }

  isValid(): boolean { return this.form.employeeId > 0 && this.form.leaveTypeId > 0 && this.form.startDate && this.form.endDate; }

  openModal(): void {
    this.form = { employeeId: 0, leaveTypeId: 0, startDate: '', endDate: '', reason: '' };
    this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);
    this.crud.create<LeaveRequest>('leave-requests', this.form).subscribe({
      next: () => { this.toast.success('Leave request submitted'); this.closeModal(); this.loadPage(this.currentPage()); this.saving.set(false); },
      error: (err) => { this.toast.error(err?.error?.message || 'Failed to submit'); this.saving.set(false); },
    });
  }

  approveLeave(record: LeaveRequest): void { this.confirmAction.set({ record, action: 'approve' }); }
  rejectLeave(record: LeaveRequest): void { this.confirmAction.set({ record, action: 'reject' }); }

  doAction(): void {
    const action = this.confirmAction();
    if (!action) return;
    const endpoint = action.action === 'approve'
      ? `leave-requests/${action.record.id}/approve`
      : `leave-requests/${action.record.id}/reject`;
    this.crud.customPost(endpoint, {}).subscribe({
      next: () => { this.toast.success(action.action === 'approve' ? 'Leave approved' : 'Leave rejected'); this.confirmAction.set(null); this.loadPage(this.currentPage()); },
      error: (err) => { this.toast.error(err?.error?.message || 'Failed'); this.confirmAction.set(null); },
    });
  }
}
