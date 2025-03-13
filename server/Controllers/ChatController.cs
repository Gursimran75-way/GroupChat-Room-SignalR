using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;
using chat.Hubs;
using chat.Interfaces;

namespace chat.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ChatController : ControllerBase
    {
        private readonly IChatRoomService _chatRoomService;
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IChatRoomService chatRoomService, IHubContext<ChatHub> hubContext)
        {
            _chatRoomService = chatRoomService;
            _hubContext = hubContext;
        }

        [HttpPost("create-room")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var success = await _chatRoomService.CreateRoom(request.RoomId, userId, request.RoomName);
                if (!success)
                {
                    return BadRequest(new
                    {
                        message = "Room ID already exists",
                        success = false,
                        data = (object)null
                    });
                }

                return Ok(new
                {
                    message = "Room created successfully!",
                    success = true,
                    data = new { RoomId = request.RoomId, RoomName = request.RoomName }
                });
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex);
                return BadRequest(new
                {
                    message = ex.Message,
                    success = false,
                    data = (object)null
                });
            }
        }

        [HttpPost("join-room")]
        public async Task<IActionResult> JoinRoom([FromBody] JoinRoomRequest request)
        {
            try
            {
                var roomExists = await _chatRoomService.RoomExists(request.RoomId);
                if (!roomExists)
                {
                    return BadRequest(new
                    {
                        message = "Room does not exist",
                        success = false,
                        data = (object)null
                    });
                }

                return Ok(new
                {
                    message = "Room joined successfully!",
                    success = true,
                    data = new { RoomId = request.RoomId }
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    success = false,
                    data = (object)null
                });
            }
        }

        [HttpDelete("delete-room")]
        public async Task<IActionResult> DeleteRoom([FromBody] DeleteRoomRequest request)
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var success = await _chatRoomService.DeleteRoom(request.RoomId, userId);
                if (!success)
                {
                    return BadRequest(new
                    {
                        message = "Room does not exist or you are not authorized to delete it",
                        success = false,
                        data = (object)null
                    });
                }

                // Notify all clients in the room that it’s been deleted
                await _hubContext.Clients.Group(request.RoomId).SendAsync("RoomDeleted", request.RoomId);

                return Ok(new
                {
                    message = "Room deleted successfully!",
                    success = true,
                    data = (object)null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = ex.Message,
                    success = false,
                    data = (object)null
                });
            }
        }
    }

    public class CreateRoomRequest
    {
        public string RoomId { get; set; }
        public string RoomName { get; set; } = "Unnamed Room";
    }

    public class JoinRoomRequest
    {
        public string RoomId { get; set; }
    }

    public class DeleteRoomRequest
    {
        public string RoomId { get; set; }
    }
}