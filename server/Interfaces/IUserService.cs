using chat.DTOs;

namespace chat.Interfaces
{
    public interface IUserService
    {
        Task<UserDto> RegisterUser(UserRegisterDto userDto);
        Task<(string, string)> LoginUser(UserLoginDto userDto); // Returns JWT token
        Task<List<UserDto>> GetAllUsers();
        Task<UserDto> GetUserById(Guid id);
        Task<UserDto> UpdateUser(Guid id, UserRegisterDto userDto);
        Task DeleteUser(Guid id);

        Task<(string, string)> RefreshToken(RefreshTokenRequest refreshTokenRequest);

        Task Logout(Guid id);

    }
}