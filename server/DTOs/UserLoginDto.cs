using System.ComponentModel.DataAnnotations;

namespace chat.DTOs
{
    public class UserLoginDto
    {
        [EmailAddress(ErrorMessage = "Pls enter a valid email")]
        public required string Email { get; set; }
        public required string Password { get; set; }
    }
}