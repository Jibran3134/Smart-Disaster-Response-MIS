namespace DisasterResponseAPI.Middleware;

/// <summary>
/// Role-Based Access Control middleware.
/// Restricts endpoints based on the authenticated user's role.
/// </summary>
public class RbacMiddleware
{
    private readonly RequestDelegate _next;

    // Maps path prefixes → allowed roles
    private static readonly Dictionary<string, string[]> RolePolicy = new(StringComparer.OrdinalIgnoreCase)
    {
        { "/api/auth",        new[] { "Admin", "Coordinator", "Responder", "Medical", "Finance" } },
        { "/api/emergencies", new[] { "Admin", "Coordinator", "Responder" } },
        { "/api/resources",   new[] { "Admin", "Coordinator", "Responder" } },
        { "/api/teams",       new[] { "Admin", "Coordinator", "Responder" } },
        { "/api/hospitals",   new[] { "Admin", "Coordinator", "Medical" } },
        { "/api/finance",     new[] { "Admin", "Finance" } },
        { "/api/approvals",   new[] { "Admin", "Coordinator", "Finance" } },
    };

    public RbacMiddleware(RequestDelegate next) => _next = next;

    public async Task InvokeAsync(HttpContext context)
    {
        var path = context.Request.Path.Value ?? "";

        // Skip open auth endpoints
        if (path.StartsWith("/api/auth/login", StringComparison.OrdinalIgnoreCase) ||
            path.StartsWith("/api/auth/register", StringComparison.OrdinalIgnoreCase))
        {
            await _next(context);
            return;
        }

        var role = context.Items["Role"]?.ToString();
        if (string.IsNullOrEmpty(role))
        {
            context.Response.StatusCode = 403;
            await context.Response.WriteAsJsonAsync(new { error = "Access denied." });
            return;
        }

        // Allow Admin everywhere
        if (role == "Admin")
        {
            await _next(context);
            return;
        }

        // Check path-based policy
        foreach (var policy in RolePolicy)
        {
            if (path.StartsWith(policy.Key, StringComparison.OrdinalIgnoreCase))
            {
                if (!policy.Value.Contains(role))
                {
                    context.Response.StatusCode = 403;
                    await context.Response.WriteAsJsonAsync(new { error = $"Role '{role}' cannot access {policy.Key}." });
                    return;
                }
                break;
            }
        }

        await _next(context);
    }
}
