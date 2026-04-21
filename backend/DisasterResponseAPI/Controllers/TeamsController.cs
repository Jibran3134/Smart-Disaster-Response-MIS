using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TeamsController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public TeamsController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<Team>("SELECT * FROM Teams ORDER BY TeamName");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<Team>(
            "SELECT * FROM Teams WHERE TeamId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Team t)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO Teams (TeamName, Specialization, Status, LeaderId, MemberCount, EmergencyId, DeployedAt)
                     VALUES (@TeamName, @Specialization, @Status, @LeaderId, @MemberCount, @EmergencyId, @DeployedAt);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, t);
        return Ok(new { teamId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Team t)
    {
        using var conn = _db.CreateConnection();
        t.TeamId = id;
        var sql = @"UPDATE Teams SET TeamName=@TeamName, Specialization=@Specialization, Status=@Status,
                     LeaderId=@LeaderId, EmergencyId=@EmergencyId, DeployedAt=@DeployedAt
                     WHERE TeamId=@TeamId";
        var affected = await conn.ExecuteAsync(sql, t);
        return affected == 0 ? NotFound() : Ok(new { message = "Updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM Teams WHERE TeamId = @id", new { id });
        return affected == 0 ? NotFound() : Ok(new { message = "Deleted." });
    }

    [HttpGet("deployed")]
    public async Task<IActionResult> GetDeployed()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_TeamDeployment WHERE Status = 'Deployed'");
        return Ok(rows);
    }
}
