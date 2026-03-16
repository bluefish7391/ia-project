import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Observable, of, throwError } from 'rxjs';
import { vi } from 'vitest';

import { ApiService } from '../../api.service';

import { Tenants } from './tenants';
import { Tenant } from '../../../../../../../shared/kinds';

class ApiServiceStub {
  get<T>(_path: string): Observable<T> {
    return of([] as T);
  }

  post<T>(_path: string, _body: unknown): Observable<T> {
    return of({} as T);
  }

  put<T>(_path: string, _body: unknown): Observable<T> {
    return of({} as T);
  }

  delete<T>(_path: string): Observable<T> {
    return of(undefined as T);
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

  it('should create a tenant using POST', async () => {
    const instance = component as any;
    vi.spyOn(apiService, 'get').mockReturnValue(of([]));
    const createdTenant: Tenant = {
      id: 'tenant-3',
      name: 'Gamma School',
      description: 'Middle campus',
    };
    const postSpy = vi
      .spyOn(apiService, 'post')
      .mockReturnValue(of(createdTenant));

    fixture.detectChanges();
    await fixture.whenStable();

    instance.addTenant();
    instance.saveTenant({
      name: 'Gamma School',
      description: 'Middle campus',
    });
    await fixture.whenStable();

    expect(postSpy).toHaveBeenCalledWith('tenants', {
      name: 'Gamma School',
      description: 'Middle campus',
    });
    expect(instance.tenants().some((tenant: Tenant) => tenant.id === 'tenant-3')).toBe(
      true,
    );
  });

  it('should update a tenant using PUT', async () => {
    const instance = component as any;
    vi.spyOn(apiService, 'get').mockReturnValue(of(mockTenants));
    const updatedTenant: Tenant = {
      id: 'tenant-1',
      name: 'Alpha School Updated',
      description: 'Updated description',
    };
    const putSpy = vi.spyOn(apiService, 'put').mockReturnValue(of(updatedTenant));

    fixture.detectChanges();
    await fixture.whenStable();

    instance.updateTenant(mockTenants[0]);
    instance.saveTenant({
      name: 'Alpha School Updated',
      description: 'Updated description',
    });
    await fixture.whenStable();

    expect(putSpy).toHaveBeenCalledWith('tenants/tenant-1', {
      name: 'Alpha School Updated',
      description: 'Updated description',
    });
    expect(instance.tenants().find((tenant: Tenant) => tenant.id === 'tenant-1')?.name).toBe(
      'Alpha School Updated',
    );
  });

  it('should delete a tenant using DELETE', async () => {
    const instance = component as any;
    vi.spyOn(apiService, 'get').mockReturnValue(of(mockTenants));
    const deleteSpy = vi.spyOn(apiService, 'delete').mockReturnValue(of(undefined));
    vi.stubGlobal('confirm', () => true);

    fixture.detectChanges();
    await fixture.whenStable();

    instance.deleteTenant(mockTenants[0]);
    await fixture.whenStable();

    expect(deleteSpy).toHaveBeenCalledWith('tenants/tenant-1');
    expect(instance.tenants().some((tenant: Tenant) => tenant.id === 'tenant-1')).toBe(
      false,
    );
    vi.unstubAllGlobals();
  });
});
