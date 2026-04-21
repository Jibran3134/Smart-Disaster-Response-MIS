using DisasterResponseAPI.Config;
using DisasterResponseAPI.Middleware;

var builder = WebApplication.CreateBuilder(args);

// Register SqlConnectionFactory as singleton
builder.Services.AddSingleton<SqlConnectionFactory>(sp =>
    new SqlConnectionFactory(builder.Configuration.GetConnectionString("DefaultConnection")!));

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:5173" };
        policy.WithOrigins(origins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

var app = builder.Build();

app.UseCors("AllowFrontend");

// Custom middleware
app.UseMiddleware<AuthMiddleware>();
app.UseMiddleware<RbacMiddleware>();

app.MapControllers();

app.Run();
