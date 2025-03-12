import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { HubConnection, HubConnectionBuilder } from '@microsoft/signalr';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../Auth/auth.service';
import { ChatRoom } from '../../models/chat-room';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private chatApiUrl = environment.chatApiUrl;
  private hubUrl = environment.signalRHubUrl;
  private hubConnection: HubConnection = new HubConnectionBuilder()
    .withUrl(this.hubUrl, { accessTokenFactory: () => this.authService.getAccessToken() || '' })
    .withAutomaticReconnect()
    .build(); // Initialize at declaration
  private messageSubject = new Subject<{ user: string, message: string, timestamp: string }>();
  private userJoinedSubject = new Subject<{ user: string, roomId: string }>();
  private userLeftSubject = new Subject<{ user: string, roomId: string }>();
  private roomDeletedSubject = new Subject<string>();
  private roomSubject = new Subject<any>();

  messages$ = this.messageSubject.asObservable();
  userJoined$ = this.userJoinedSubject.asObservable();
  userLeft$ = this.userLeftSubject.asObservable();
  roomDeleted$ = this.roomDeletedSubject.asObservable();
  roomInfo$ = this.roomSubject.asObservable();

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {
    this.initializeSignalR();
  }

  private initializeSignalR() {
    this.hubConnection.start()
      .then(() => console.log('SignalR Connected'))
      .catch(err => console.error('SignalR Connection Error:', err));

    this.hubConnection.on('ReceiveMessage', (user: string, message: string, timestamp: string) => {
      this.messageSubject.next({ user, message, timestamp });
    });

    this.hubConnection.on('UserJoined', (user: string, roomId: string, userId: string, room: any) => {
      console.log(room,"room....................")
      this.roomSubject.next(room);
      this.userJoinedSubject.next({ user, roomId });
    });

    this.hubConnection.on('UserLeft', (user: string, roomId: string) => {
      this.userLeftSubject.next({ user, roomId });
    });

    this.hubConnection.on('RoomDeleted', (roomId: string) => {
      this.roomDeletedSubject.next(roomId);
      this.roomSubject.next(null);
      this.snackBar.open(`Room ${roomId} has been deleted`, 'Close', { duration: 5000 });
    });
  }

  createRoom(roomId: string, roomName: string): Observable<any> {
    return this.http.post(`${this.chatApiUrl}/create-room`, { roomId, roomName }).pipe(
      tap(() => this.snackBar.open('Room created successfully!', 'Close', { duration: 3000 })),
      catchError(error => {
        this.snackBar.open(error.error?.message || 'Failed to create room', 'Close', { duration: 5000 });
        throw error;
      })
    );
  }

  joinRoom(roomId: string): Observable<any> {
    if (!roomId) {
      this.snackBar.open('Please enter a Room ID', 'Close', { duration: 3000 });
      return throwError(() => new Error('Room ID is required'));
    }
    return this.http.post(`${this.chatApiUrl}/join-room`, { roomId }).pipe(
      tap(() => {
        console.log("testing.......")
        this.hubConnection.invoke('JoinRoom', roomId)
          .catch(err => console.error('Error joining room:', err));
      }),
      catchError(error => {
        this.snackBar.open(error.error?.message || 'Failed to join room', 'Close', { duration: 5000 });
        throw error;
      })
    );
  }
  joinRoomAPI(roomId: string): Observable<any> {
    if (!roomId) {
      this.snackBar.open('Please enter a Room ID', 'Close', { duration: 3000 });
      return throwError(() => new Error('Room ID is required'));
    }
    return this.http.post(`${this.chatApiUrl}/join-room`, { roomId }).pipe(
      catchError(error => {
        this.snackBar.open(error.error?.message || 'Failed to join room', 'Close', { duration: 5000 });
        throw error;
      })
    );
  }

  sendMessage(roomId: string, message: string): void {
    this.hubConnection.invoke('SendMessage', roomId, message)
      .catch(err => console.error('Error sending message:', err));
  }

  leaveRoom(roomId: string): void {
    this.hubConnection.invoke('LeaveRoom', roomId)
      .then(() => console.log(`Left room ${roomId}`))
      .catch(err => console.error('Error leaving room:', err));
  }

  deleteRoom(roomId: string): Observable<any> {
    return this.http.delete(`${this.chatApiUrl}/delete-room`, { body: { roomId } });
  }

  disconnect(): void {
    this.hubConnection.stop()
      .then(() => console.log('SignalR Disconnected'))
      .catch(err => console.error('SignalR Disconnect Error:', err));
  }
}