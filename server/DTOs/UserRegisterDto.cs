using System.ComponentModel.DataAnnotations;

namespace chat.DTOs
{
    public class UserRegisterDto
    {
        public required string Name { get; set; }

        [EmailAddress(ErrorMessage = "Pls enter a valid email")]
        public required string Email { get; set; }
        public required string Password { get; set; }

        public string? Role { get; set; }
    }
}