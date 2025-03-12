import { Component } from '@angular/core';
import { AuthService } from '../../shared/services/Auth/auth.service';
import { ChatService } from '../../shared/services/Chat/chat.service';
import { Router } from '@angular/router';
import { v4 as uuidv4 } from 'uuid';
import { CommonModule } from '@angular/common'; // For *ngIf
import { FormsModule } from '@angular/forms'; // For ngModel
import { MatFormFieldModule } from '@angular/material/form-field'; // For mat-form-field
import { MatInputModule } from '@angular/material/input'; // For matInput
import { MatButtonModule } from '@angular/material/button'; // For mat-raised-button
import { MatIconModule } from '@angular/material/icon'; // For mat-icon

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent {
  roomId: string = '';
  roomName: string = '';

  constructor(
    public authService: AuthService,
    private chatService: ChatService,
    private router: Router
  ) {}

  createRoom() {
    this.roomId = uuidv4(); // Generate UUID
    this.chatService.createRoom(this.roomId, this.roomName || 'Unnamed Room').subscribe({
      next: () => this.router.navigate(['/app/chat', this.roomId]),
      error: () => {} // Error handled in ChatService
    });
  }

  joinRoom() {
    if (!this.roomId) {
      this.chatService.joinRoom('') // Trigger error in service
        .subscribe({
          error: () => {} // Handled in ChatService
        });
      return;
    }
    this.chatService.joinRoomAPI(this.roomId).subscribe({
      next: () => this.router.navigate(['/app/chat', this.roomId]),
      error: () => {} // Error handled in ChatService
    });
  }
}