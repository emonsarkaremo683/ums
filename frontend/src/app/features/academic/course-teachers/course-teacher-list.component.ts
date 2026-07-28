import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface CourseTeacher {
  id: number; courseId: number; courseName: string; courseCode: string;
  employeeId: number; employeeName: string; academicSessionId: number; academicSessionName: string;
}

interface Course { id: number; name: string; code: string; }
interface Employee { id: number; firstName: string; lastName: string; }
interface AcademicSession { id: number; name: string; }

@Component({
  selector: 'app-course-teacher-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, ConfirmDialogComponent],
  template: `
    <app-page-header title="Course-Teacher Assignments" subtitle="Assign teachers to courses for each academic session">
      <button class="btn btn-gold" (click)="openModal()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Assign Teacher
      </button>
    </app-page-header>

    <div class="card card-elevated animate-fade-in-up stagger-1">
      <div class="card-body">
        @if (loading()) {
          <div class="empty-state"><p>Loading assignments...</p></div>
        } @else if (rows().length === 0) {
          <div class="empty-state">
            <p class="empty-title">No assignments</p>
            <p class="empty-subtitle">Assign teachers to courses to get started.</p>
          </div>
        } @else {
          <div class="table-scroll">
            <table class="table">
              <thead>
                <tr>
                  <th>Course</th>
                  <th>Code</th>
                  <th>Teacher</th>
                  <th>Session</th>
                  <th style="text-align:center;width:100px">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (row of rows(); track row.id) {
                  <tr>
                    <td>{{ row.courseName }}</td>
                    <td>{{ row.courseCode }}</td>
                    <td>{{ row.employeeName }}</td>
                    <td>{{ row.academicSessionName }}</td>
                    <td style="text-align:center">
                      <button class="btn btn-ghost btn-sm text-danger" (click)="confirmDelete.set(row); $event.stopPropagation()">Remove</button>
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
            <h2>Assign Teacher</h2>
            <button class="btn-close" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>
          <form class="modal-body" (ngSubmit)="save()">
            <div class="form-group">
              <label class="form-label">Course <span class="req">*</span></label>
              <select class="form-select" [(ngModel)]="form.courseId" name="courseId" required>
                <option [ngValue]="0">Select course</option>
                @for (c of courses(); track c.id) {
                  <option [ngValue]="c.id">{{ c.code }} - {{ c.name }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Teacher <span class="req">*</span></label>
              <select class="form-select" [(ngModel)]="form.employeeId" name="employeeId" required>
                <option [ngValue]="0">Select teacher</option>
                @for (e of employees(); track e.id) {
                  <option [ngValue]="e.id">{{ e.firstName }} {{ e.lastName }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">Academic Session <span class="req">*</span></label>
              <select class="form-select" [(ngModel)]="form.academicSessionId" name="academicSessionId" required>
                <option [ngValue]="0">Select session</option>
                @for (s of sessions(); track s.id) {
                  <option [ngValue]="s.id">{{ s.name }}</option>
                }
              </select>
            </div>
            <div class="modal-footer">
              <div class="footer-spacer"></div>
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" [disabled]="!isValid() || saving()">{{ saving() ? 'Saving...' : 'Assign' }}</button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (confirmDelete()) {
      <app-confirm-dialog
        title="Remove Assignment"
        [message]="'Remove ' + confirmDelete()!.employeeName + ' from ' + confirmDelete()!.courseName + '?'"
        confirmLabel="Remove"
        type="danger"
        (confirm)="doDelete()"
        (cancel)="confirmDelete.set(null)"
      />
    }
  `,
  styles: [`
    :host { display: block; max-width: 1200px; }
    .table-scroll { overflow-x: auto; }
    .table { --bs-table-bg: transparent; --bs-table-color: var(--color-text-primary); --bs-table-border-color: var(--color-border); width: 100%; margin-bottom: 0;
      thead th { font-weight: var(--fw-semibold); color: var(--color-text-muted); text-transform: uppercase; font-size: var(--fs-xs); letter-spacing: 0.06em; padding: 0.75rem 1rem; border-bottom: 1px solid var(--color-border); white-space: nowrap; }
      tbody td { padding: 0.75rem 1rem; font-size: var(--fs-small); border-bottom: 1px solid var(--color-border); vertical-align: middle; }
      tbody tr { transition: background-color 0.15s; &:hover { background-color: var(--color-surface-elevated); } }
    }
    .text-danger { color: #EF4444; }
    .empty-state { text-align: center; padding: 3rem; }
    .empty-title { font-family: var(--font-display); font-size: var(--fs-h3); color: var(--color-text-secondary); margin-bottom: 0.25rem; }
    .empty-subtitle { font-size: var(--fs-small); color: var(--color-text-muted); }
    .table-footer { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border-top: 1px solid var(--color-border); }
    .table-info { font-size: var(--fs-small); color: var(--color-text-muted); }
    .table-pagination { display: flex; align-items: center; gap: 0.25rem; }
    .btn-sm { padding: 0.3rem 0.6rem; font-size: var(--fs-xs); min-width: 32px; height: 32px; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; align-items: center; justify-content: center; z-index: 10001; }
    .modal-panel { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: var(--radius-lg); width: 90%; max-width: 520px; box-shadow: var(--shadow-lg); animation: fadeInUp 0.3s var(--ease-spring); }
    .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border); h2 { font-family: var(--font-display); font-size: var(--fs-h3); } }
    .btn-close { background: none; border: none; color: var(--color-text-muted); padding: 4px; cursor: pointer; &:hover { color: var(--color-text-primary); } }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .req { color: var(--color-danger); }
    .modal-footer { display: flex; align-items: center; gap: 0.75rem; padding-top: 1rem; }
    .footer-spacer { flex: 1; }
  `],
})
export class CourseTeacherListComponent implements OnInit {
  rows = signal<CourseTeacher[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);
  visiblePages = signal<number[]>([]);

  showModal = signal(false);
  saving = signal(false);
  courses = signal<Course[]>([]);
  employees = signal<Employee[]>([]);
  sessions = signal<AcademicSession[]>([]);
  form: any = { courseId: 0, employeeId: 0, academicSessionId: 0 };
  confirmDelete = signal<CourseTeacher | null>(null);

  constructor(private crud: CrudService, private toast: ToastService) {}

  ngOnInit(): void {
    this.loadPage(0);
    this.crud.listAll<Course>('courses').subscribe({
      next: (d) => this.courses.set(d),
      error: () => this.toast.error('Failed to load courses'),
    });
    this.crud.listAll<Employee>('employees/active').subscribe({
      next: (d) => this.employees.set(d),
      error: () => this.toast.error('Failed to load employees'),
    });
    this.crud.listAll<AcademicSession>('academic-sessions').subscribe({
      next: (d) => this.sessions.set(d),
      error: () => this.toast.error('Failed to load sessions'),
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<CourseTeacher>('course-teachers', page, 10).subscribe({
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

  isValid(): boolean { return this.form.courseId > 0 && this.form.employeeId > 0 && this.form.academicSessionId > 0; }

  openModal(): void {
    this.form = { courseId: 0, employeeId: 0, academicSessionId: 0 };
    this.showModal.set(true);
  }
  closeModal(): void { this.showModal.set(false); }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);
    this.crud.create<CourseTeacher>('course-teachers', this.form).subscribe({
      next: () => { this.toast.success('Teacher assigned'); this.closeModal(); this.loadPage(this.currentPage()); this.saving.set(false); },
      error: (err) => { this.toast.error(err?.error?.message || 'Failed'); this.saving.set(false); },
    });
  }

  doDelete(): void {
    const item = this.confirmDelete();
    if (!item) return;
    this.crud.delete('course-teachers', item.id).subscribe({
      next: () => { this.toast.success('Assignment removed'); this.confirmDelete.set(null); this.loadPage(this.currentPage()); },
      error: () => this.confirmDelete.set(null),
    });
  }
}
