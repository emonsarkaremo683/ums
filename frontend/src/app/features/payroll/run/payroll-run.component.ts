import { Component, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import { DataTableComponent, TableColumn } from '../../../shared/components/data-table/data-table.component';
import { CrudService } from '../../../core/services/crud.service';
import { ToastService } from '../../../core/services/toast.service';

interface PayrollRun { id: number; month: string; year: number; completed: boolean; totalEmployees: number; }

@Component({
  selector: 'app-payroll-run',
  standalone: true,
  imports: [FormsModule, PageHeaderComponent, DataTableComponent],
  template: `
    <div class="page animate-fade-in-up">
      <app-page-header title="Payroll Run" subtitle="Process monthly payroll and generate payslips">
        <div class="selector-group">
          <label class="form-label">Month</label>
          <select class="form-control" [(ngModel)]="selectedMonth">
            <option value="">Select month</option>
            @for (month of months; track month.value) {
              <option [value]="month.value">{{ month.label }}</option>
            }
          </select>
        </div>
        <div class="selector-group">
          <label class="form-label">Year</label>
          <select class="form-control" [(ngModel)]="selectedYear">
            <option [ngValue]="0">Select year</option>
            @for (year of years; track year) {
              <option [ngValue]="year">{{ year }}</option>
            }
          </select>
        </div>
        <button class="btn btn-gold" (click)="executePayroll()" [disabled]="!selectedMonth || !selectedYear || running()">
          @if (running()) { <span class="spinner-sm"></span> Processing... } @else { Execute Payroll }
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
            emptyTitle="No payroll runs"
            emptySubtitle="Execute payroll to generate runs for the selected month/year."
            (pageChange)="loadPage($event)"
          />
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1200px; }
    .page-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;
      flex-wrap: wrap; gap: 1rem;
    }
    .selector-group {
      display: flex; flex-direction: column; gap: 0.375rem; min-width: 180px;
    }
    .form-label { margin-bottom: 0.375rem; }

    :host {
      display: block;
      max-width: 1200px;
    }

    .spinner-sm {
      width: 14px; height: 14px; border: 2px solid transparent;
      border-top-color: currentColor; border-radius: 50%; animation: spin 0.6s linear infinite;
      display: inline-block;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `],
})
export class PayrollRunComponent implements OnInit {
  columns: TableColumn[] = [
    { key: 'month', label: 'Month', sortable: true, width: '120px' },
    { key: 'year', label: 'Year', sortable: true, width: '100px', align: 'center' },
    { key: 'totalEmployees', label: 'Employees', width: '110px', align: 'center' },
    { key: 'completed', label: 'Status', width: '100px', align: 'center' },
  ];

  months = [
    { value: '01', label: 'January' }, { value: '02', label: 'February' }, { value: '03', label: 'March' },
    { value: '04', label: 'April' }, { value: '05', label: 'May' }, { value: '06', label: 'June' },
    { value: '07', label: 'July' }, { value: '08', label: 'August' }, { value: '09', label: 'September' },
    { value: '10', label: 'October' }, { value: '11', label: 'November' }, { value: '12', label: 'December' },
  ];

  years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - 2 + i);

  selectedMonth = '';
  selectedYear = new Date().getFullYear();

  rows = signal<PayrollRun[]>([]);
  loading = signal(false);
  running = signal(false);
  currentPage = signal(0);
  totalPages = signal(1);
  totalElements = signal(0);

  constructor(
    private crud: CrudService,
    private toast: ToastService,
  ) {}

  ngOnInit(): void {
    this.loadPage(0);
  }

  executePayroll(): void {
    if (!this.selectedMonth || !this.selectedYear) return;

    this.running.set(true);
    this.crud.customPost<any, any>(`payroll/run-v2`, { month: this.selectedMonth, year: this.selectedYear }).subscribe({
      next: () => {
        this.toast.success(`Payroll executed for ${this.getMonthName(this.selectedMonth)} ${this.selectedYear}`);
        this.running.set(false);
        this.loadPage(0);
      },
      error: () => {
        this.toast.error('Payroll execution failed');
        this.running.set(false);
      },
    });
      },
      error: (err) => {
        this.running.set(false);
        this.toast.error(err?.error?.message || 'Failed to execute payroll');
      },
    });
  }

  loadPage(page: number): void {
    this.loading.set(true);
    this.crud.list<PayrollRun>('payroll/runs', page, 10).subscribe({
      next: (d) => {
        this.rows.set(d.content || []);
        this.currentPage.set(d.number);
        this.totalPages.set(d.totalPages);
        this.totalElements.set(d.totalElements);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  getMonthName(monthNumber: string): string {
    const month = this.months.find(m => m.value === monthNumber);
    return month ? month.label : '';
  }
}
