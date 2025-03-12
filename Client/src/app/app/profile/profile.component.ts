import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { AuthService } from '../../shared/services/Auth/auth.service';
import { User } from '../../shared/models/user';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon'; // Already included
import { Observable } from 'rxjs';
import {
  trigger,
  state,
  style,
  animate,
  transition,
} from '@angular/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss'],
  animations: [
    // Fade-in animation for form
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),

    // Shake animation on error
    trigger('shake', [
      state('noError', style({ transform: 'translateX(0)' })),
      state('error', style({ transform: 'translateX(0)' })),
      transition('noError => error', [
        animate('0.3s', style({ transform: 'translateX(-10px)' })),
        animate('0.3s', style({ transform: 'translateX(10px)' })),
        animate('0.3s', style({ transform: 'translateX(-5px)' })),
        animate('0.3s', style({ transform: 'translateX(5px)' })),
        animate('0.3s', style({ transform: 'translateX(0)' })),
      ]),
    ]),
  ],
})
export class ProfileComponent implements OnInit {
  updateForm!: FormGroup;
  user$!: Observable<User | null>;
  hidePassword = true;
  errorMessage: string | null = null;
  errorState = 'noError';
  isLoading = false;

  constructor(private fb: FormBuilder, public authService: AuthService) {}

  ngOnInit(): void {
    this.user$ = this.authService.user$;
    this.updateForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
    });

    this.user$.subscribe((user: User | null) => {
      if (user) {
        this.updateForm.patchValue({
          name: user.name,
          email: user.email,
        });
      }
    });
  }

  onUpdate() {
    if (this.updateForm.valid) {
      const { name, email, password } = this.updateForm.value;
      const userId = this.authService.getCurrentUser()?.id;
      if (userId) {
        this.isLoading = true;
        this.authService.updateUser(userId, name, email, password).subscribe({
          next: () => {
            this.authService.loadUserProfile();
            this.isLoading = false;
          },
          error: (err) => {
            this.isLoading = false;
            this.errorMessage =
              err.error?.message || 'Updation failed. Please try again.';
          },
        });
      } else {
        this.authService.loadUserProfile();
        // this.errorMessage = 'Updation failed. Please try again.';
        this.errorState = 'error'; // Trigger shake animation
        setTimeout(() => (this.errorState = 'noError'), 500);
      }
    }
  }
}
