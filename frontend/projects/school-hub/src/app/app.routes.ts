import { Routes } from '@angular/router';
import { authGuard } from './auth/auth.guard';
import { firebaseOnlyGuard } from './auth/firebase-only.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'admin',
    pathMatch: 'full',
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () => import('./auth/register/register').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password').then((m) => m.ForgotPasswordComponent),
  },
  {
    path: 'select-tenant',
    canActivate: [firebaseOnlyGuard],
    loadComponent: () =>
      import('./auth/tenant-selector/tenant-selector.component').then(
        (m) => m.TenantSelectorComponent,
      ),
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    loadChildren: () => import('./admin/admin-module').then((module) => module.AdminModule),
  },
  {
    path: 'sys-admin',
    canActivate: [authGuard],
    loadChildren: () => import('./sys-admin/sys-admin-module').then((module) => module.SysAdminModule),
  }
];
