using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using chat.Data;
using chat.DTOs;
using chat.Models;

namespace chat.Services
{
    public class UserService : IUserService
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public UserService(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        public async Task<UserDto> RegisterUser(UserRegisterDto userDto)
        {
            try
            {
                var existingUser = await _context.Users.FirstOrDefaultAsync(u => u.Email == userDto.Email);
                if (existingUser != null)
                    throw new Exception("User with this email already exists");

                var user = new User
                {
                    Name = userDto.Name,
                    Email = userDto.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password),
                    IsActive = true,
                    Role = Enum.TryParse<UserRole>(userDto.Role, true, out var role) ? role : UserRole.User,
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();

                return MapToDto(user);
            }
            catch (Exception ex)
            {
                throw new Exception($"Registration failed: {ex.Message}");
            }
        }

        public async Task<(string, string)> LoginUser(UserLoginDto userDto)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == userDto.Email);
                if (user == null || !BCrypt.Net.BCrypt.Verify(userDto.Password, user.PasswordHash))
                    throw new UnauthorizedAccessException("Invalid credentials");

                string accessToken = GenerateJwtToken(user);
                string refreshToken = GenerateRefreshToken();

                user.RefreshToken = refreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7); // Refresh token valid for 7 days
                await _context.SaveChangesAsync();

                return (refreshToken, accessToken);
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new Exception($"Login failed: {ex.Message}");
            }
            catch (Exception ex)
            {
                throw new Exception($"An error occurred during login: {ex.Message}");
            }
        }

        public async Task<List<UserDto>> GetAllUsers()
        {
            try
            {
                var users = await _context.Users.ToListAsync();
                return users.Select(u => MapToDto(u)).ToList();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error fetching users: {ex.Message}");
            }
        }

        public async Task<UserDto> GetUserById(Guid id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) throw new Exception("User not found");
                return MapToDto(user);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error retrieving user: {ex.Message}");
            }
        }

        public async Task<UserDto> UpdateUser(Guid id, UserRegisterDto userDto)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) throw new Exception("User not found");

                user.Name = userDto.Name;
                user.Email = userDto.Email;
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(userDto.Password);
                user.Role = Enum.TryParse<UserRole>(userDto.Role, true, out var role) ? role : UserRole.User;

                await _context.SaveChangesAsync();
                return MapToDto(user);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error updating user: {ex.Message}");
            }
        }

        public async Task DeleteUser(Guid id)
        {
            try
            {
                var user = await _context.Users.FindAsync(id);
                if (user == null) throw new Exception("User not found");

                _context.Users.Remove(user);
                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                throw new Exception($"Error deleting user: {ex.Message}");
            }
        }

        public async Task<(string, string)> RefreshToken(RefreshTokenRequest refreshTokenRequest)
        {
            try
            {
                var user = await _context.Users.FirstOrDefaultAsync(u => u.RefreshToken == refreshTokenRequest.RefreshToken);

                if (user == null || user.RefreshTokenExpiry < DateTime.UtcNow)
                    throw new UnauthorizedAccessException("Invalid or expired refresh token");

                string newAccessToken = GenerateJwtToken(user);
                string newRefreshToken = GenerateRefreshToken();

                user.RefreshToken = newRefreshToken;
                user.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
                await _context.SaveChangesAsync();

                return (newRefreshToken, newAccessToken);
            }
            catch (UnauthorizedAccessException ex)
            {
                throw new Exception($"Refresh token error: {ex.Message}");
            }
            catch (Exception ex)
            {
                throw new Exception($"An error occurred while refreshing the token: {ex.Message}");
            }
        }

        public async Task Logout(Guid id)
        {
            var user = await _context.Users.FindAsync(id);
            if (user == null) throw new Exception("User not found");

            user.RefreshToken = null;
            user.RefreshTokenExpiry = null;
            await _context.SaveChangesAsync();
        }


        private UserDto MapToDto(User user)
        {
            return new UserDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                IsActive = user.IsActive,
                Role = user.Role.ToString(),
                RefreshToken = user.RefreshToken
            };
        }

        private string GenerateJwtToken(User user)
        {
            try
            {
                var claims = new[]
                {
                    new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
                    new Claim(ClaimTypes.Email, user.Email),
                    new Claim(ClaimTypes.Name, user.Name),
                    new Claim(ClaimTypes.Role, user.Role.ToString())
                };

                var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]));
                var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

                var token = new JwtSecurityToken(
                    issuer: _configuration["Jwt:Issuer"],
                    audience: _configuration["Jwt:Audience"],
                    claims: claims,
                    // expires: DateTime.UtcNow.AddMinutes(1),//1 min
                    expires: DateTime.UtcNow.AddHours(1),//1 hour
                    signingCredentials: creds);

                return new JwtSecurityTokenHandler().WriteToken(token);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error generating JWT token: {ex.Message}");
            }
        }

        private string GenerateRefreshToken()
        {
            try
            {
                var randomNumber = new byte[32];
                using (var rng = RandomNumberGenerator.Create())
                {
                    rng.GetBytes(randomNumber);
                }
                return Convert.ToBase64String(randomNumber);
            }
            catch (Exception ex)
            {
                throw new Exception($"Error generating refresh token: {ex.Message}");
            }
        }
    }
}
