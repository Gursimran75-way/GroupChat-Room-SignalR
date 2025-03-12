import { Routes } from '@angular/router';
import { ChatComponent } from './chat/chat/chat.component';

export const APP_ROUTES: Routes = [
  { path: '', loadComponent: () => import('./home/home.component').then(m => m.HomeComponent) },
  { path: 'profile', loadComponent: () => import('./profile/profile.component').then(m => m.ProfileComponent) },
  { path: 'chat/:roomId', component: ChatComponent}
];
