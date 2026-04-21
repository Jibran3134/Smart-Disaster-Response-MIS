using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    private readonly IConfiguration _config;

    public AuthController(SqlConnectionFactory db, IConfiguration config)
    {
        _db = db;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        using var conn = _db.CreateConnection();
        var exists = await conn.QueryFirstOrDefaultAsync<int>(
            "SELECT COUNT(*) FROM Users WHERE Email = @Email", new { req.Email });
        if (exists > 0) return Conflict(new { error = "Email already registered." });

        var hash = BCrypt.Net.BCrypt.HashPassword(req.Password);
        var sql = @"INSERT INTO Users (FullName, Email, PasswordHash, Role, Phone)
                     VALUES (@FullName, @Email, @PasswordHash, @Role, @Phone);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var userId = await conn.QuerySingleAsync<int>(sql, new
        {
            req.FullName, req.Email, PasswordHash = hash, req.Role, req.Phone
        });
        return Ok(new { userId, message = "Registration successful." });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        using var conn = _db.CreateConnection();
        var user = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT * FROM Users WHERE Email = @Email AND IsActive = 1", new { req.Email });
        if (user == null || !BCrypt.Net.BCrypt.Verify(req.Password, user.PasswordHash))
            return Unauthorized(new { error = "Invalid credentials." });

        var token = GenerateJwt(user);
        return Ok(new { token, user = new { user.UserId, user.FullName, user.Email, user.Role } });
    }

    [HttpGet("me")]
    public async Task<IActionResult> Me()
    {
        var userId = HttpContext.Items["UserId"]?.ToString();
        if (userId == null) return Unauthorized();
        using var conn = _db.CreateConnection();
        var user = await conn.QueryFirstOrDefaultAsync<User>(
            "SELECT UserId, FullName, Email, Role, Phone, IsActive FROM Users WHERE UserId = @UserId",
            new { UserId = int.Parse(userId) });
        return user == null ? NotFound() : Ok(user);
    }

    private string GenerateJwt(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new[]
        {
            new Claim("userId", user.UserId.ToString()),
            new Claim("email", user.Email),
            new Claim("role", user.Role),
            new Claim("fullName", user.FullName)
        };
        var expiry = int.Parse(_config["Jwt:ExpiryMinutes"] ?? "480");
        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(expiry),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
