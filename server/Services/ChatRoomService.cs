using Microsoft.EntityFrameworkCore;
using chat.Data;
using chat.Models;
using chat.Interfaces;

namespace chat.Services
{ 
    public class ChatRoomService : IChatRoomService
    {
        private readonly AppDbContext _context;

        public ChatRoomService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<bool> CreateRoom(string roomId, Guid createdByUserId, string roomName = "Unnamed Room")
        {
            var existingRoom = await _context.ChatRooms.FirstOrDefaultAsync(r => r.RoomId == roomId);
            if (existingRoom != null)
            {
                Console.WriteLine($"Room {roomId} already exists.");
                return false;
            }

            var chatRoom = new Models.ChatRoom
            {
                RoomId = roomId,
                Name = roomName,
                CreatedById = createdByUserId
            };

            try
            {
                Console.WriteLine($"Attempting to add room: RoomId={roomId}, Name={roomName}, CreatedByUserId={createdByUserId}");
                _context.ChatRooms.Add(chatRoom);
                await _context.SaveChangesAsync();
                Console.WriteLine($"Room {roomId} saved successfully.");
                return true;
            }
            catch (DbUpdateException ex)
            {
                Console.WriteLine($"DbUpdateException: {ex.Message}, Inner: {ex.InnerException?.Message}, Stack: {ex.StackTrace}");
                throw;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"General Exception: {ex.Message}, Inner: {ex.InnerException?.Message}, Stack: {ex.StackTrace}");
                throw;
            }
        }

        public async Task<bool> RoomExists(string roomId)
        {
            return await _context.ChatRooms.AnyAsync(r => r.RoomId == roomId);
        }
        
        public async Task<bool> DeleteRoom(string roomId, Guid userId)
        {
            var room = await _context.ChatRooms.FirstOrDefaultAsync(r => r.RoomId == roomId);
            if (room == null)
            {
                return false; // Room doesn't exist
            }

            if (room.CreatedById != userId)
            {
                return false; // User is not the creator
            }

            _context.ChatRooms.Remove(room);
            await _context.SaveChangesAsync();
            return true;
        }
        
        
        
        public async Task<ChatRoom?> GetRoomInfo(string roomId)
        {
            try
            {
                var room = await _context.ChatRooms
                    .FirstOrDefaultAsync(r => r.RoomId == roomId);

                return room;
            }
            catch (Exception ex)
            {
                throw new Exception($"Error getting room info: {ex.Message}");
            }
        }
        
        
    }
}