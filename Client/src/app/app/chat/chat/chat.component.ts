import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router'; // Add Router
import { ChatService } from '../../../shared/services/Chat/chat.service';
import { AuthService } from '../../../shared/services/Auth/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.scss']
})
export class ChatComponent implements OnInit, OnDestroy {
  roomId: string = '';
  messages: { user: string, message: string, timestamp: string }[] = [];
  newMessage: string = '';
  usersInRoom: string[] = [];
  roomInfo$: Observable<any>;

  constructor(
    private route: ActivatedRoute,
    private router: Router, // Inject Router here
    private chatService: ChatService,
    public authService: AuthService,
  ) {
    this.roomInfo$ = this.chatService.roomInfo$;
  }

  ngOnInit() {
    this.roomId = this.route.snapshot.paramMap.get('roomId') || '';
    this.chatService.joinRoom(this.roomId).subscribe();

    this.chatService.messages$.subscribe(msg => {
      this.messages.push(msg);
    });

    this.chatService.userJoined$.subscribe(({ user }) => {
      if (!this.usersInRoom.includes(user)) {
        this.usersInRoom.push(user);
      }
    });

    this.chatService.userLeft$.subscribe(({ user }) => {
      this.usersInRoom = this.usersInRoom.filter(u => u !== user);
    });

    this.chatService.roomDeleted$.subscribe(deletedRoomId => {
      if (deletedRoomId === this.roomId) {
        this.router.navigate(['/app/home']); // Use local router
      }
    });
  }

  sendMessage() {
    if (this.newMessage.trim()) {
      this.chatService.sendMessage(this.roomId, this.newMessage);
      this.newMessage = '';
    }
  }

  leaveRoom() {
    this.chatService.leaveRoom(this.roomId);
    this.router.navigate(['/app/home']); // Use local router
  }

  deleteRoom() {
    this.chatService.deleteRoom(this.roomId).subscribe(() => {
      this.router.navigate(['/app/home']); // Use local router
    });
  }

  ngOnDestroy() {
    this.chatService.leaveRoom(this.roomId);
  }
}