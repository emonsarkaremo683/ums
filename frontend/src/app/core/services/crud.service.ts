import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiResponse } from '../models/api-response.model';
import { Page } from '../models/pagination.model';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CrudService {
  private readonly base = environment.apiUrl;

  constructor(private http: HttpClient) {}

  list<T>(endpoint: string, page = 0, size = 10, sort?: string, extraParams?: Record<string, string>): Observable<Page<T>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    if (sort) params = params.set('sort', sort);
    if (extraParams) {
      for (const [key, value] of Object.entries(extraParams)) {
        if (value) params = params.set(key, value);
      }
    }

    return this.http
      .get<ApiResponse<Page<T>>>(`${this.base}/${endpoint}`, { params })
      .pipe(map((res) => res.data));
  }

  listAll<T>(endpoint: string): Observable<T[]> {
    return this.http
      .get<ApiResponse<any>>(`${this.base}/${endpoint}`)
      .pipe(map((res) => {
        const d = res.data;
        if (Array.isArray(d)) return d as T[];
        if (d && Array.isArray(d.content)) return d.content as T[];
        return [];
      }));
  }

  getById<T>(endpoint: string, id: number | string): Observable<T> {
    return this.http
      .get<ApiResponse<T>>(`${this.base}/${endpoint}/${id}`)
      .pipe(map((res) => res.data));
  }

  create<T, R = T>(endpoint: string, body: T): Observable<R> {
    return this.http
      .post<ApiResponse<R>>(`${this.base}/${endpoint}`, body)
      .pipe(map((res) => res.data));
  }

  update<T, R = T>(endpoint: string, id: number | string, body: T): Observable<R> {
    return this.http
      .put<ApiResponse<R>>(`${this.base}/${endpoint}/${id}`, body)
      .pipe(map((res) => res.data));
  }

  delete(endpoint: string, id: number | string): Observable<void> {
    return this.http
      .delete<ApiResponse<void>>(`${this.base}/${endpoint}/${id}`)
      .pipe(map(() => undefined));
  }

  customPost<T, R>(endpoint: string, body: T): Observable<R> {
    return this.http
      .post<ApiResponse<R>>(`${this.base}/${endpoint}`, body)
      .pipe(map((res) => res.data));
  }

  customPut<T, R>(endpoint: string, body?: T): Observable<R> {
    return this.http
      .put<ApiResponse<R>>(`${this.base}/${endpoint}`, body ?? {})
      .pipe(map((res) => res.data));
  }

  uploadFile<T>(endpoint: string, formData: FormData): Observable<T> {
    return this.http
      .post<ApiResponse<T>>(`${this.base}/${endpoint}`, formData)
      .pipe(map((res) => res.data));
  }

  customGet<T>(fullUrl: string): Observable<T> {
    const url = fullUrl.startsWith('/') ? `${this.base}${fullUrl}` : `${this.base}/${fullUrl}`;
    return this.http
      .get<ApiResponse<T>>(url)
      .pipe(map((res) => res.data));
  }
}
