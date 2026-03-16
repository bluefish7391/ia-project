import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUri = '/api/';

  get<T>(path: string, options?: object): Observable<T> {
    return this.http.get<T>(this.buildUrl(path), options);
  }

  post<T>(path: string, body: unknown, options?: object): Observable<T> {
    return this.http.post<T>(this.buildUrl(path), body, options);
  }

  put<T>(path: string, body: unknown, options?: object): Observable<T> {
    return this.http.put<T>(this.buildUrl(path), body, options);
  }

  delete<T>(path: string, options?: object): Observable<T> {
    return this.http.delete<T>(this.buildUrl(path), options);
  }

  private buildUrl(path: string): string {
    const sanitizedPath = path.startsWith('/') ? path.slice(1) : path;
    return `${this.baseUri}${sanitizedPath}`;
  }
}
