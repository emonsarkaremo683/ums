import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface JobPosting {
  id: number;
  title: string;
  description: string;
  department: string;
  vacancies: number;
  postingDate: string;
  closingDate: string;
  active: boolean;
}

interface JobPostingRequest {
  title: string;
  description: string;
  department: string;
  vacancies: number;
  postingDate: string;
  closingDate: string;
}

@Component({
  selector: 'app-job-posting-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Job Postings" subtitle="Manage job openings and vacancies">
        <button class="btn btn-gold" (click)="openModal()">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          Add Job Posting
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
            emptyTitle="No job postings found"
            emptySubtitle="Create your first job posting to attract talent."
            (pageChange)="loadPage($event)"
            (rowClick)="openModal($event)"
          />
        </div>
      </div>

      @if (showModal()) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editing() ? 'Edit' : 'Create' }} Job Posting</h2>
              <button class="btn-close" (click)="closeModal()">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
              </button>
            </div>

            <form class="modal-body" (ngSubmit)="save()">
              <div class="form-group">
                <label class="form-label">Title <span class="required">*</span></label>
                <input type="text" class="form-control" [(ngModel)]="form.title" name="title" required placeholder="e.g. Senior Software Engineer">
              </div>

              <div class="form-group">
                <label class="form-label">Description</label>
                <textarea class="form-control" [(ngModel)]="form.description" name="description" rows="3" placeholder="Job responsibilities, requirements, etc."></textarea>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Department <span class="required">*</span></label>
                  <input type="text" class="form-control" [(ngModel)]="form.department" name="department" required placeholder="e.g. Engineering">
                </div>
                <div class="form-group">
                  <label class="form-label">Vacancies <span class="required">*</span></label>
                  <input type="number" class="form-control" [(ngModel)]="form.vacancies" name="vacancies" required [min]="1" placeholder="e.g. 2">
                </div>
              </div>

              <div class="form-row">
                <div class="form-group">
                  <label class="form-label">Posting Date <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="form.postingDate" name="postingDate" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Closing Date <span class="required">*</span></label>
                  <input type="date" class="form-control" [(ngModel)]="form.closingDate" name="closingDate" required>
                </div>
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
          title="Delete Job Posting"
          [message]="'Are you sure you want to deactivate ' + confirmDelete()!.title + '?'"
          confirmLabel="Deactivate"
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
      border-radius: var(--radius-lg); width: 90%; max-width: 560px;
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
    .form-row {
      display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;
    }
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .required { color: var(--color-danger); }
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
export class JobPostingListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'title', label: 'Title', sortable: true },
    { key: 'department', label: 'Department', sortable: true, width: '120px' },
    { key: 'vacancies', label: 'Vacancies', width: '100px', align: 'center' },
    { key: 'postingDate', label: 'Posted', width: '120px', align: 'center' },
    { key: 'closingDate', label: 'Closes', width: '120px', align: 'center' },
    { key: 'active', label: 'Status', width: '100px', align: 'center' },
    { key: 'id', label: '', width: '80px', align: 'center' },
  ];

  rows = signal<JobPosting[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showModal = signal(false);
  editing = signal<JobPosting | null>(null);
  saving = signal(false);
  confirmDelete = signal<JobPosting | null>(null);

  form: JobPostingRequest = { title: '', description: '', department: '', vacancies: 1, postingDate: '', closingDate: '' };

  constructor(
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<JobPosting>('job-postings', page, 10).subscribe({
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

  openModal(jobPosting?: JobPosting): void {
    if (jobPosting) {
      this.editing.set(jobPosting);
      this.form = {
        title: jobPosting.title,
        description: jobPosting.description,
        department: jobPosting.department,
        vacancies: jobPosting.vacancies,
        postingDate: jobPosting.postingDate,
        closingDate: jobPosting.closingDate,
      };
    } else {
      this.editing.set(null);
      this.form = { title: '', description: '', department: '', vacancies: 1, postingDate: '', closingDate: '' };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
  }

  isValid(): boolean {
    return !!(this.form.title && this.form.department && this.form.vacancies >= 1 && this.form.postingDate && this.form.closingDate);
  }

  save(): void {
    if (!this.isValid()) return;
    this.saving.set(true);

    const obs = this.editing()
      ? this.crud.update<JobPostingRequest>('job-postings', this.editing()!.id, this.form)
      : this.crud.create<JobPostingRequest>('job-postings', this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Job posting updated' : 'Job posting created');
        this.closeModal();
        this.loadPage(this.currentPage());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const posting = this.confirmDelete();
    if (!posting) return;

    this.crud.delete('job-postings', posting.id).subscribe({
      next: () => {
        this.toast.success('Job posting deactivated');
        this.confirmDelete.set(null);
        this.loadPage(this.currentPage());
      },
      error: () => this.toast.error('Failed to deactivate'),
    });
  }
}