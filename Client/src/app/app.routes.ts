import { Routes } from '@angular/router';
import { AuthGuard } from './shared/services/Guard/auth.guard';
import { AuthGuard2 } from './shared/services/Guard/auth-guard2.service';

export const routes: Routes = [
  { path: '', redirectTo: '/auth/login', pathMatch: 'full' },

  {
    path: 'app',
    canActivate: [AuthGuard],
    loadChildren: () => import('./app/app.routes').then(m => m.APP_ROUTES)
  },
  {
    path: 'auth',
    canActivate: [AuthGuard2],
    loadChildren: () => import('./auth/auth.routes').then(m => m.AUTH_ROUTES)
  },

  { path: '**', redirectTo: '/auth/login' }
];
