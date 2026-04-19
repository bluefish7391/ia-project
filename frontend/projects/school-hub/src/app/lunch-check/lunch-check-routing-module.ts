import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./lunch-check').then((m) => m.LunchCheckComponent),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./home/lunch-check-home').then((m) => m.LunchCheckHomeComponent),
      },
      {
        path: 'clock-in',
        data: { checkingIn: true },
        loadComponent: () =>
          import('./clock-action/lunch-check-clock-action').then((m) => m.LunchCheckClockActionComponent),
      },
      {
        path: 'clock-out',
        data: { checkingIn: false },
        loadComponent: () =>
          import('./clock-action/lunch-check-clock-action').then((m) => m.LunchCheckClockActionComponent),
      },
      {
        path: 'records',
        loadComponent: () =>
          import('./home/lunch-check-home').then((m) => m.LunchCheckHomeComponent),
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class LunchCheckRoutingModule {}
