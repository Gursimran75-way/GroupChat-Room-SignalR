namespace chat.Models
{
    public enum UserRole
    {
        User,  // Default
        Admin
    }

    public class User
    {
        public Guid Id { get; set; } = Guid.NewGuid();
        public required string Name { get; set; }
        public required string Email { get; set; }
        public required string PasswordHash { get; set; } // Store hashed password
        public bool IsActive { get; set; } = true;
        public UserRole Role { get; set; } = UserRole.User; // Default to User

        public string? RefreshToken { get; set; }
        public DateTime? RefreshTokenExpiry { get; set; }
    }
}