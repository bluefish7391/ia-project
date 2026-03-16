import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ApiService } from '../../api.service';

import { Tenants } from './tenants';

interface Tenant {
  id: string;
  name: string;
  description?: string;
}

class ApiServiceStub {
  get<T>(_path: string): Observable<T> {
    return of([] as T);
  }
}

describe('Tenants', () => {
  let component: Tenants;
  let fixture: ComponentFixture<Tenants>;
  let apiService: ApiServiceStub;

  const mockTenants: Tenant[] = [
    { id: 'tenant-1', name: 'Alpha School', description: 'Primary campus' },
    { id: 'tenant-2', name: 'Beta School' },
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Tenants],
      providers: [{ provide: ApiService, useClass: ApiServiceStub }],
    }).compileComponents();

    apiService = TestBed.inject(ApiService) as unknown as ApiServiceStub;
    fixture = TestBed.createComponent(Tenants);
    component = fixture.componentInstance;
  });

  it('should create and load tenants', async () => {
    const getSpy = vi.spyOn(apiService, 'get').mockReturnValue(of(mockTenants));

    fixture.detectChanges();
    await fixture.whenStable();

    expect(component).toBeTruthy();
    expect(getSpy).toHaveBeenCalledWith('tenants');
    expect(fixture.nativeElement.textContent).toContain('Alpha School');
    expect(fixture.nativeElement.textContent).toContain('Beta School');
  });

  it('should show an error message when tenant loading fails', async () => {
    vi.spyOn(apiService, 'get').mockReturnValue(
      throwError(() => new Error('request failed')),
    );

    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.nativeElement.textContent).toContain(
      'Unable to load tenants. Please try again.',
    );
  });
});
