import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';

interface Appraisal {
  id: number;
  employeeId: number;
  employeeName: string;
  appraisalDate: string;
  reviewYear: number;
  rating: string;
  comments: string;
  reviewerId: number;
  reviewerName: string;
}

interface AppraisalRequest {
  employeeId: number;
  appraisalDate: string;
  reviewYear: number;
  rating: string;
  comments: string;
  reviewerId: number;
}

@Component({
  selector: 'app-appraisal-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent, NgbDropdownModule],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Appraisals" subtitle="Manage employee performance appraisals">
        <button class="btn btn-gold" (click)="openModal()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Add Appraisal
        </button>
      </app-page-header>

      <div class="card card-elevated">
        <div class="card-body">
          <app-data-table
            [columns]="columns"
            [rows]="rows()"
            [page]="currentPage()"
            [totalPages]="totalPages()"
            [totalElements]="totalElements()"
            [loading]="loading()"
            emptyTitle="No appraisals found"
            emptySubtitle="Create your first appraisal to track employee performance."
            (pageChange)="loadPage($event)"
            (rowClick)="openModal($event)"
          />
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editing() ? 'Edit' : 'Create' }} Appraisal</h2>
              <button class="btn-close" (click)="closeModal()">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <form class="modal-body" (ngSubmit)="save()">
              <div class="form-group">
                <label class="form-label">Employee <span class="required">*</span></label>
                <div class="dropdown-select" ngbDropdown>
                  <button class="form-control" [class.has-value]="form.employeeId" ngbDropdownToggle>
                    {{ form.employeeId ? getEmployeeName(form.employeeId) : 'Select employee...' }}
                  </button>
                  @if (employees().length > 0) {
                    <div class="dropdown-menu">
                        @for (employee of employees(); track employee.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectEmployee(employee.id)">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </button>
                        }
                    </div>
                  }
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Appraisal Date <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="form.appraisalDate" name="appraisalDate" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Review Year <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="form.reviewYear" name="reviewYear" required [min]="2000" [max]="currentYear">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Rating <span class="required">*</span></label>
                  <select class="form-control" [(ngModel)]="form.rating" name="rating" required>
                    <option value="">Select rating</option>
                    <option value="OUTSTANDING">Outstanding</option>
                    <option value="EXCELLENT">Excellent</option>
                    <option value="GOOD">Good</option>
                    <option value="SATISFACTORY">Satisfactory</option>
                    <option value="NEEDS_IMPROVEMENT">Needs Improvement</option>
                    <option value="UNSATISFACTORY">Unsatisfactory</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Reviewer</label>
                  <div class="dropdown-select" ngbDropdown>
                    <button class="form-control" [class.has-value]="form.reviewerId" ngbDropdownToggle>
                      {{ form.reviewerId ? getEmployeeName(form.reviewerId) : 'Select reviewer...' }}
                    </button>
                    @if (employees().length > 0) {
                      <div class="dropdown-menu">
                        @for (employee of employees(); track employee.id) {
                          <button class="dropdown-item" ngbDropdownItem (click)="selectReviewer(employee.id)">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </button>
                        }
                      </div>
                    }
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label class="form-label">Comments</label>
                <textarea class="form-control" [(ngModel)]="form.comments" name="comments" rows="3" placeholder="Feedback and comments..."></textarea>
              </div>

              <div class="modal-footer">
                <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
                <button type="submit" class="btn btn-gold" [disabled]="!isValid() || saving()">
                  @if (saving()) { <span class="spinner-sm"></span> Saving... } @else { {{ editing() ? 'Update' : 'Create' }} }
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      @if (confirmDelete()) {
        <app-confirm-dialog
          title="Delete Appraisal"
          [message]="'Are you sure you want to delete this appraisal for ' + confirmDelete()!.employeeName + '?'"
          confirmLabel="Delete"
          type="danger"
          (confirm)="doDelete()"
          (cancel)="confirmDelete.set(null)"
        ></app-confirm-dialog>
      }
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; }
    .page-title { font-family: var(--font-display); font-size: var(--fs-h1); margin-bottom: 0.25rem; }
    .page-subtitle { color: var(--color-text-muted); font-size: var(--fs-small); }

    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center;
      justify-content: center; z-index: 10001; animation: fadeIn 0.2s var(--ease-out);
    }
    .modal-panel {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); width: 90%; max-width: 640px;
      box-shadow: var(--shadow-lg); animation: fadeInUp 0.3s var(--ease-spring);
    }
    .modal-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid var(--color-border);
      h2 { font-family: var(--font-display); font-size: var(--fs-h3); }
    }
    .btn-close {
      background: none; border: none; color: var(--color-text-muted); padding: 4px;
      cursor: pointer; border-radius: var(--radius-sm);
      &:hover { color: var(--color-text-primary); background: var(--color-surface-elevated); }
    }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .required { color: var(--color-danger); }
    .dropdown-select {
      position: relative; width: 100%;
      .form-control { cursor: pointer; }
      .has-value { color: var(--color-text-primary); }
    }
    .dropdown-menu {
      position: absolute; top: 100%; left: 0; right: 0;
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-md); max-height: 240px; overflow-y: auto;
      z-index: 10002; margin-top: 4px;
    }
    .dropdown-item {
      display: block; width: 100%; background: none; border: none;
      text-align: left; padding: 0.75rem 1rem; cursor: pointer;
      color: var(--color-text-primary); transition: all var(--duration-fast) var(--ease-out);
      &:hover { background: var(--color-surface-elevated); color: var(--color-gold); }
    }
    textarea.form-control { resize: vertical; min-height: 80px; }
    .modal-footer {
      display: flex; justify-content: flex-end; gap: 0.75rem;
      padding-top: 1rem; margin-top: 0.5rem;
    }
    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid transparent;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block;
    }
  `],
})
export class AppraisalListComponent implements OnInit {
  currentYear = new Date().getFullYear();
  columns: TableColumn[] = [
    { key: 'employeeName', label: 'Employee', sortable: true },
    { key: 'appraisalDate', label: 'Date', width: '120px', align: 'center' },
    { key: 'reviewYear', label: 'Year', width: '100px', align: 'center' },
    { key: 'rating', label: 'Rating', width: '150px' },
    { key: 'reviewerName', label: 'Reviewer', width: '150px' },
    { key: 'id', label: '', width: '80px', align: 'center' },
  ];

  rows = signal<Appraisal[]>([]);
  employees = signal<any[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showModal = signal(false);
  editing = signal<Appraisal | null>(null);
  saving = signal(false);
  confirmDelete = signal<Appraisal | null>(null);

  form: AppraisalRequest = {
    employeeId: 0,
    appraisalDate: '',
    reviewYear: new Date().getFullYear(),
    rating: '',
    comments: '',
    reviewerId: 0,
  };

  constructor(
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
    this.loadPage(0);
  }

  loadInitialData(): void {
    this.crud.listAll('employees').subscribe({ next: (data) => this.employees.set(data || []) });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<Appraisal>('appraisals', page, 10).subscribe({
      next: (data) => {
        this.rows.set(data.content || []);
        this.currentPage.set(data.number);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  selectEmployee(employeeId: number): void {
    this.form.employeeId = employeeId;
  }

  selectReviewer(reviewerId: number): void {
    this.form.reviewerId = reviewerId;
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees().find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Unknown';
  }

  isValid(): boolean {
    return !!(this.form.employeeId && this.form.appraisalDate && this.form.reviewYear &&
             this.form.rating && this.form.reviewYear >= 2000 && this.form.reviewYear <= this.currentYear);
  }

  openModal(appraisal?: Appraisal): void {
    if (appraisal) {
      this.editing.set(appraisal);
      this.form = {
        employeeId: appraisal.employeeId,
        appraisalDate: appraisal.appraisalDate,
        reviewYear: appraisal.reviewYear,
        rating: appraisal.rating,
        comments: appraisal.comments,
        reviewerId: appraisal.reviewerId,
      };
    } else {
      this.editing.set(null);
      this.form = {
        employeeId: 0,
        appraisalDate: '',
        reviewYear: this.currentYear,
        rating: '',
        comments: '',
        reviewerId: 0,
      };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    const obs = this.editing()
      ? this.crud.update<AppraisalRequest>('appraisals', this.editing()!.id, this.form)
      : this.crud.create<AppraisalRequest>('appraisals', this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Appraisal updated' : 'Appraisal created');
        this.closeModal();
        this.loadPage(this.currentPage());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const appraisal = this.confirmDelete();
    if (!appraisal) return;

    this.crud.delete('appraisals', appraisal.id).subscribe({
      next: () => {
        this.toast.success('Appraisal deleted');
        this.confirmDelete.set(null);
        this.loadPage(this.currentPage());
      },
      error: () => this.toast.error('Failed to delete'),
    });
  }
}