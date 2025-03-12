import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../shared/services/Auth/auth.service';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { trigger, state, style, animate, transition } from '@angular/animations';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatIconModule, 
    RouterLink,
    MatProgressSpinnerModule,
  ],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  animations: [
    // Fade-in animation for form
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-50px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ]),
    
    // Shake animation on error
    trigger('shake', [
      state('noError', style({ transform: 'translateX(0)' })),
      state('error', style({ transform: 'translateX(0)' })),
      transition('noError => error', [
        animate(
          '0.3s',
          style({ transform: 'translateX(-10px)' })
        ),
        animate(
          '0.3s',
          style({ transform: 'translateX(10px)' })
        ),
        animate(
          '0.3s',
          style({ transform: 'translateX(-5px)' })
        ),
        animate(
          '0.3s',
          style({ transform: 'translateX(5px)' })
        ),
        animate(
          '0.3s',
          style({ transform: 'translateX(0)' })
        )
      ])
    ])
  ]
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  hidePassword = true; // Add this for password visibility toggle
  errorMessage: string | null = null;
  errorState = 'noError';
  isLoading = false;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group({
      name: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required],
      role: ['', Validators.required]
    });
  }

  onSubmit() {
    if (this.registerForm.valid) {
      this.isLoading = true;
      const { name, email, password, role } = this.registerForm.value;
      this.authService.register(name, email, password, role).subscribe({
        next: () => {
          this.isLoading = false;
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Registration failed. Please try again.';
          this.errorState = 'error';
          setTimeout(() => (this.errorState = 'noError'), 500); 
        }
      });
    }
  }
}