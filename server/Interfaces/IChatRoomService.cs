using chat.Models;

namespace chat.Interfaces
{
    public interface IChatRoomService
    {
        Task<bool> CreateRoom(string roomId, Guid createdByUserId, string roomName = "Unnamed Room");
        Task<bool> RoomExists(string roomId);

        Task<bool> DeleteRoom(string roomId, Guid userId);

        Task<ChatRoom?> GetRoomInfo(string roomId);
    }
}