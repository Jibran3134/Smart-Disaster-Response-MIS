using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ApprovalsController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public ApprovalsController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<Approval>("SELECT * FROM Approvals ORDER BY RequestedAt DESC");
        return Ok(rows);
    }

    [HttpGet("pending")]
    public async Task<IActionResult> GetPending()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_PendingApprovals ORDER BY RequestedAt ASC");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<Approval>(
            "SELECT * FROM Approvals WHERE ApprovalId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Approval a)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO Approvals (EntityType, EntityId, RequestedBy, Comments)
                     VALUES (@EntityType, @EntityId, @RequestedBy, @Comments);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, a);
        return Ok(new { approvalId = id });
    }

    [HttpPut("{id}/review")]
    public async Task<IActionResult> Review(int id, [FromBody] Approval a)
    {
        var reviewerId = HttpContext.Items["UserId"]?.ToString();
        using var conn = _db.CreateConnection();
        var sql = @"UPDATE Approvals SET Status=@Status, ReviewedBy=@ReviewedBy, Comments=@Comments
                     WHERE ApprovalId=@ApprovalId AND Status='Pending'";
        var affected = await conn.ExecuteAsync(sql, new
        {
            ApprovalId = id,
            a.Status,
            ReviewedBy = reviewerId != null ? int.Parse(reviewerId) : (int?)null,
            a.Comments
        });
        return affected == 0 ? NotFound(new { error = "Not found or already reviewed." }) : Ok(new { message = "Reviewed." });
    }
}
