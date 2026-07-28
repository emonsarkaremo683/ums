import { Component, signal, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CrudService } from '../../../core/services/crud.service';

interface Circular {
  id: number; title: string; session: string; facultyId: number; facultyName: string;
  registrationStartDate: string; registrationEndDate: string;
  applicationFee: number; totalSeats: number; active: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="home">
      <section class="hero">
        <div class="hero-bg">
          <div class="bg-radial"></div>
        </div>
        <div class="hero-content animate-fade-in-up">
          <h1 class="hero-title">Welcome to<br><span class="text-gold">Smart University</span></h1>
          <p class="hero-subtitle">Empowering minds, shaping futures. Discover world-class education and research opportunities.</p>
          <div class="hero-actions">
            <a routerLink="/circulars" class="btn btn-gold">View Admissions</a>
            <a routerLink="/login" class="btn btn-ghost">Sign In</a>
          </div>
        </div>
      </section>

      <section class="features">
        <div class="features-inner">
          <div class="feature-card animate-fade-in-up stagger-1">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M12 3L1 9l11 6 11-6-11-6zM1 9v6l11 6 11-6V9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>World-Class Faculty</h3>
            <p>Learn from distinguished professors and industry experts across multiple disciplines.</p>
          </div>
          <div class="feature-card animate-fade-in-up stagger-2">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M4 19.5A2.5 2.5 0 016.5 17H20" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Research Excellence</h3>
            <p>Access cutting-edge labs and contribute to groundbreaking research projects.</p>
          </div>
          <div class="feature-card animate-fade-in-up stagger-3">
            <div class="feature-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="1.5"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            </div>
            <h3>Global Community</h3>
            <p>Join a diverse community of students from over 50 countries worldwide.</p>
          </div>
        </div>
      </section>

      @if (activeCirculars().length > 0) {
        <section class="circulars-preview">
          <div class="section-inner">
            <h2 class="section-title animate-fade-in-up">Open Admissions</h2>
            <div class="circulars-grid">
              @for (c of activeCirculars(); track c.id) {
                <div class="circular-card animate-fade-in-up">
                  <div class="circular-badge">Open</div>
                  <h3>{{ c.title }}</h3>
                  <p class="circular-meta">{{ c.facultyName }} &middot; {{ c.session }}</p>
                  <div class="circular-details">
                    <div class="detail">
                      <span class="detail-label">Seats</span>
                      <span class="detail-value">{{ c.totalSeats }}</span>
                    </div>
                    <div class="detail">
                      <span class="detail-label">Fee</span>
                      <span class="detail-value">{{ c.applicationFee }} BDT</span>
                    </div>
                    <div class="detail">
                      <span class="detail-label">Deadline</span>
                      <span class="detail-value">{{ c.registrationEndDate }}</span>
                    </div>
                  </div>
                  <a [routerLink]="['/apply', c.id]" class="btn btn-gold btn-block">Apply Now</a>
                </div>
              }
            </div>
            <div class="section-footer animate-fade-in-up">
              <a routerLink="/circulars" class="btn btn-ghost">View All Circulars</a>
            </div>
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .hero {
      position: relative;
      padding: 6rem 2rem 4rem;
      text-align: center;
      overflow: hidden;
    }
    .hero-bg {
      position: absolute;
      inset: 0;
      z-index: 0;
    }
    .bg-radial {
      position: absolute;
      inset: 0;
      background:
        radial-gradient(circle at 30% 30%, var(--color-gold-dim) 0%, transparent 50%),
        radial-gradient(circle at 70% 70%, rgba(200, 169, 110, 0.04) 0%, transparent 50%);
    }
    .hero-content {
      position: relative;
      z-index: 1;
      max-width: 700px;
      margin: 0 auto;
    }
    .hero-title {
      font-family: var(--font-display);
      font-size: var(--fs-hero);
      line-height: 1.1;
      margin-bottom: 1.25rem;
    }
    .hero-subtitle {
      font-size: var(--fs-body);
      color: var(--color-text-secondary);
      max-width: 500px;
      margin: 0 auto 2rem;
      line-height: 1.7;
    }
    .hero-actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
    }

    .features {
      padding: 4rem 2rem;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
      border-bottom: 1px solid var(--color-border);
    }
    .features-inner {
      max-width: 1000px;
      margin: 0 auto;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 2rem;
    }
    .feature-card {
      padding: 2rem;
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      background: var(--color-surface-elevated);
    }
    .feature-icon {
      width: 48px;
      height: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-md);
      background: var(--color-gold-dim);
      color: var(--color-gold);
      margin-bottom: 1.25rem;
    }
    .feature-card h3 {
      font-family: var(--font-display);
      font-size: var(--fs-h3);
      margin-bottom: 0.5rem;
    }
    .feature-card p {
      font-size: var(--fs-small);
      color: var(--color-text-secondary);
      line-height: 1.6;
    }

    .circulars-preview {
      padding: 4rem 2rem;
    }
    .section-inner {
      max-width: 1000px;
      margin: 0 auto;
    }
    .section-title {
      font-family: var(--font-display);
      font-size: var(--fs-h1);
      text-align: center;
      margin-bottom: 2rem;
    }
    .circulars-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }
    .circular-card {
      background: var(--color-surface);
      border: 1px solid var(--color-border);
      border-radius: var(--radius-md);
      padding: 1.5rem;
      position: relative;
      transition: border-color var(--duration-normal) var(--ease-out),
                  box-shadow var(--duration-normal) var(--ease-out);
    }
    .circular-card:hover {
      border-color: var(--color-border-hover);
      box-shadow: var(--shadow-md);
    }
    .circular-badge {
      display: inline-block;
      font-size: var(--fs-xs);
      font-weight: var(--fw-semibold);
      padding: 0.2rem 0.6rem;
      border-radius: 999px;
      background: var(--color-success-bg);
      color: var(--color-success);
      margin-bottom: 0.75rem;
    }
    .circular-card h3 {
      font-family: var(--font-display);
      font-size: var(--fs-h3);
      margin-bottom: 0.25rem;
    }
    .circular-meta {
      font-size: var(--fs-small);
      color: var(--color-text-muted);
      margin-bottom: 1rem;
    }
    .circular-details {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.25rem;
      padding-top: 1rem;
      border-top: 1px solid var(--color-border);
    }
    .detail-label {
      display: block;
      font-size: var(--fs-xs);
      color: var(--color-text-muted);
      text-transform: uppercase;
      letter-spacing: 0.04em;
      margin-bottom: 0.125rem;
    }
    .detail-value {
      font-size: var(--fs-small);
      font-weight: var(--fw-semibold);
      color: var(--color-text-primary);
    }
    .btn-block {
      width: 100%;
      justify-content: center;
    }
    .section-footer {
      text-align: center;
      margin-top: 2rem;
    }

    @media (max-width: 768px) {
      .hero { padding: 4rem 1.5rem 3rem; }
      .features-inner { grid-template-columns: 1fr; }
      .circulars-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class HomeComponent implements OnInit {
  activeCirculars = signal<Circular[]>([]);

  constructor(private crud: CrudService) {}

  ngOnInit(): void {
    this.crud.list<Circular>('admission-circulars', 0, 6, undefined, { active: 'true' }).subscribe({
      next: (d) => this.activeCirculars.set(d.content.filter(c => c.active)),
      error: () => this.toast.error('Failed to load circulars'),
    });
  }
}
