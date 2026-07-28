import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface Faculty {
  id: number;
  name: string;
  code: string;
  description: string;
  active: boolean;
}

interface FacultyRequest {
  name: string;
  code: string;
  description: string;
}

@Component({
  selector: 'app-faculty-list',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent, ConfirmDialogComponent],
  template: `
    <app-page-header title="Faculties" subtitle="Manage university faculties">
      <button class="btn btn-gold" (click)="openModal()">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 3v10M3 8h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        Add Faculty
      </button>
    </app-page-header>

    <app-data-table
      [columns]="columns"
      [rows]="rows()"
      [page]="currentPage()"
      [totalPages]="totalPages()"
      [totalElements]="totalElements()"
      [loading]="loading()"
      emptyTitle="No faculties found"
      emptySubtitle="Create your first faculty to get started."
      (pageChange)="loadPage($event)"
      (rowClick)="openModal($event)"
    />

    @if (showModal()) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal-panel animate-fade-in-up" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editing() ? 'Edit' : 'Create' }} Faculty</h2>
            <button class="btn-close" (click)="closeModal()">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M13.5 4.5L4.5 13.5M4.5 4.5l9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
            </button>
          </div>

          <form class="modal-body" (ngSubmit)="save()">
            <div class="form-group">
              <label class="form-label">Faculty Name <span class="required">*</span></label>
              <input type="text" class="form-control" [(ngModel)]="form.name" name="name" required placeholder="e.g. Faculty of Science">
            </div>
            <div class="form-group">
              <label class="form-label">Code</label>
              <input type="text" class="form-control" [(ngModel)]="form.code" name="code" placeholder="e.g. FSCI">
            </div>
            <div class="form-group">
              <label class="form-label">Description</label>
              <textarea class="form-control" [(ngModel)]="form.description" name="description" rows="3" placeholder="Brief description..."></textarea>
            </div>

            <div class="modal-footer">
              @if (editing()) {
                <button type="button" class="btn btn-danger" (click)="confirmDelete.set(editing()); closeModal()">
                  Delete
                </button>
              }
              <div class="footer-spacer"></div>
              <button type="button" class="btn btn-ghost" (click)="closeModal()">Cancel</button>
              <button type="submit" class="btn btn-gold" [disabled]="!form.name || saving()">
                @if (saving()) { <span class="spinner-sm"></span> Saving... } @else { {{ editing() ? 'Update' : 'Create' }} }
              </button>
            </div>
          </form>
        </div>
      </div>
    }

    @if (confirmDelete()) {
      <app-confirm-dialog
        title="Delete Faculty"
        [message]="'Are you sure you want to deactivate ' + confirmDelete()!.name + '?'"
        confirmLabel="Deactivate"
        type="danger"
        (confirm)="doDelete()"
        (cancel)="confirmDelete.set(null)"
      />
    }
  `,
  styles: [`
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.6);
      backdrop-filter: blur(4px); display: flex; align-items: center;
      justify-content: center; z-index: 10001; animation: fadeIn 0.2s var(--ease-out);
    }
    .modal-panel {
      background: var(--color-surface); border: 1px solid var(--color-border);
      border-radius: var(--radius-lg); width: 90%; max-width: 480px;
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
    .form-group { display: flex; flex-direction: column; }
    .form-label { margin-bottom: 0.375rem; }
    .required { color: var(--color-danger); }
    textarea.form-control { resize: vertical; min-height: 80px; }
    .modal-footer {
      display: flex; align-items: center; gap: 0.75rem;
      padding-top: 1rem; margin-top: 0.5rem;
    }
    .footer-spacer { flex: 1; }
    .btn-danger {
      background: var(--color-danger); color: white;
      &:hover { background: #dc2626; }
    }
    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid transparent;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block;
    }
  `],
})
export class FacultyListComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'name', label: 'Name', sortable: true },
    { key: 'code', label: 'Code', sortable: true, width: '120px' },
    { key: 'description', label: 'Description' },
    { key: 'active', label: 'Status', width: '100px', align: 'center' },
    { key: 'id', label: '', width: '80px', align: 'center' },
  ];

  rows = signal<Faculty[]>([]);
  loading = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  showModal = signal(false);
  editing = signal<Faculty | null>(null);
  saving = signal(false);
  confirmDelete = signal<Faculty | null>(null);

  form: FacultyRequest = { name: '', code: '', description: '' };

  constructor(
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<Faculty>('faculties', page, 10).subscribe({
      next: (data) => {
        this.rows.set(data.content);
        this.currentPage.set(data.number);
        this.totalPages.set(data.totalPages);
        this.totalElements.set(data.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  openModal(faculty?: Faculty): void {
    if (faculty) {
      this.editing.set(faculty);
      this.form = { name: faculty.name, code: faculty.code, description: faculty.description };
    } else {
      this.editing.set(null);
      this.form = { name: '', code: '', description: '' };
    }
    this.showModal.set(true);
  }

  closeModal(): void {
    this.showModal.set(false);
    this.editing.set(null);
  }

  save(): void {
    if (!this.form.name) return;
    this.saving.set(true);

    const obs = this.editing()
      ? this.crud.update<FacultyRequest>('faculties', this.editing()!.id, this.form)
      : this.crud.create<FacultyRequest>('faculties', this.form);

    obs.subscribe({
      next: () => {
        this.toast.success(this.editing() ? 'Faculty updated' : 'Faculty created');
        this.closeModal();
        this.loadPage(this.currentPage());
        this.saving.set(false);
      },
      error: () => this.saving.set(false),
    });
  }

  doDelete(): void {
    const faculty = this.confirmDelete();
    if (!faculty) return;

    this.crud.delete('faculties', faculty.id).subscribe({
      next: () => {
        this.toast.success('Faculty deactivated');
        this.confirmDelete.set(null);
        this.loadPage(this.currentPage());
      },
      error: () => this.toast.error('Failed to deactivate faculty'),
    });
  }
}
