import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./admin-shell').then((m) => m.AdminShellComponent),
    children: [
      {
        path: 'organizations',
        loadComponent: () =>
          import('./organizations').then((module) => module.Organizations),
      },
      {
        path: 'tenants',
        loadComponent: () => import('./tenants/tenants').then((module) => module.Tenants),
      },
      {
        path: 'app-users',
        loadComponent: () =>
          import('./app-users/app-users').then((module) => module.AppUsers),
      },
      {
        path: 'todo-list',
        loadComponent: () =>
          import('./todo-list/todo-list').then((module) => module.TodoList),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
