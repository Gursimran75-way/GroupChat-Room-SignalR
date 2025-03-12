using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using chat.DTOs;
using chat.Services;

namespace chat
{
    [Route("api/[controller]")]
    [ApiController]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpPost("signup")]
        public async Task<IActionResult> Signup([FromBody] UserRegisterDto userDto)
        {
            try
            {
                var user = await _userService.RegisterUser(userDto);
                return Ok(new
                {
                    message = "User registered successfully!",
                    success = true,
                    data = user
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

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] UserLoginDto userDto)
        {
            try
            {
                var (refreshToken, accessToken) = await _userService.LoginUser(userDto);
                return Ok(new
                {
                    message = "Login successful!",
                    success = true,
                    data = new
                    {
                        AccessToken = accessToken,
                        RefreshToken = refreshToken
                    }
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

        [HttpGet]
        [Authorize]
        public async Task<IActionResult> GetAllUsers()
        {
            try
            {
                var users = await _userService.GetAllUsers();
                return Ok(new
                {
                    message = "Users fetched successfully!",
                    success = true,
                    data = users
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

        [HttpGet("me")]
        [Authorize]
        public async Task<IActionResult> GetUserById()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                var user = await _userService.GetUserById(userId);
                return Ok(new
                {
                    message = "User fetched successfully!",
                    success = true,
                    data = user
                });
            }
            catch (Exception ex)
            {
                return NotFound(new
                {
                    message = ex.Message,
                    success = false,
                    data = (object)null
                });
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        public async Task<IActionResult> UpdateUser(Guid id, [FromBody] UserRegisterDto userDto)
        {
            try
            {
                var updatedUser = await _userService.UpdateUser(id, userDto);
                return Ok(new
                {
                    message = "User updated successfully!",
                    success = true,
                    data = updatedUser
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

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteUser(Guid id)
        {
            try
            {
                await _userService.DeleteUser(id);
                return Ok(new
                {
                    message = "User deleted successfully!",
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

        [HttpPost("refresh-token")]
        public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequest refreshTokenRequest)
        {
            try
            {
                var (newRefreshToken, newAccessToken) = await _userService.RefreshToken(refreshTokenRequest);
                return Ok(new
                {
                    message = "Token refreshed successfully!",
                    success = true,
                    data = new
                    {
                        accessToken = newAccessToken,
                        refreshToken = newRefreshToken
                    }
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

        [HttpPost("logout")]
        [Authorize]
        public async Task<IActionResult> Logout()
        {
            try
            {
                var userId = Guid.Parse(User.FindFirst(ClaimTypes.NameIdentifier)?.Value);
                await _userService.Logout(userId);
                return Ok(new
                {
                    message = "Logout successful!",
                    success = true,
                    data = (object)null
                });
            }
            catch (Exception ex)
            {
                return BadRequest(new
                {
                    message = "Failed to Logout",
                    success = false,
                    data = (object)null
                });
            }
        }

    }
}
