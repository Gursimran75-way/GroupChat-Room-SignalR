using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using chat.Interfaces;

namespace chat.Hubs
{
    [Authorize]
    public class ChatHub : Hub
    {
        
        private readonly IChatRoomService _chatRoomService;

        public ChatHub(IChatRoomService chatRoomService)
        {
            _chatRoomService = chatRoomService;
        }
        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"Client connected: {Context.ConnectionId}, UserId: {userId ?? "Not authenticated"}, Name: {Context.User?.Identity?.Name}");
            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception exception)
        {
            Console.WriteLine($"Client disconnected: {Context.ConnectionId},UserId: {Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "Not authenticated"}, Name: {Context.User?.Identity?.Name}, Error: {exception?.Message}");
            await base.OnDisconnectedAsync(exception);
        }

        public async Task JoinRoom(string roomId)
        {
            try
            {
                var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
                Console.WriteLine($"JoinRoom called: RoomId={roomId},  UserId: {userId ?? "Not authenticated"}, ConnectionId={Context.ConnectionId}, Name: {Context.User?.Identity?.Name}");
                var room = await _chatRoomService.GetRoomInfo(roomId);
                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                await Clients.Group(roomId).SendAsync("UserJoined", Context.User?.Identity?.Name, roomId, userId, room);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error in JoinRoom: {ex.Message}, Stack: {ex.StackTrace}");
                throw;
            }
        }

        public async Task LeaveRoom(string roomId)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"LeaveRoom called: RoomId={roomId},  UserId: {userId ?? "Not authenticated"}, Name: {Context.User?.Identity?.Name}");
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId);
            await Clients.Group(roomId).SendAsync("UserLeft", Context.User?.Identity?.Name, roomId, userId);
        }

        public async Task SendMessage(string roomId, string message)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            Console.WriteLine($"SendMessage called: RoomId={roomId}, Message={message}, UserId: {userId ?? "Not authenticated"}, Name: {Context.User?.Identity?.Name}");
            var userName = Context.User?.Identity?.Name ?? "Anonymous";
            await Clients.Group(roomId).SendAsync("ReceiveMessage", userName, message, userId, DateTime.UtcNow.ToString("yyyy-MM-dd HH:mm:ss"));
        }
    }
}