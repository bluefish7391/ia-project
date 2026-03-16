import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: 'tenants',
    loadComponent: () => import('./tenants/tenants').then((module) => module.Tenants),
  },
  {
    path: 'todo-list',
    loadComponent: () =>
      import('./todo-list/todo-list').then((module) => module.TodoList),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdminRoutingModule {}
