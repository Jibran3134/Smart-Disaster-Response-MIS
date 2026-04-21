using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmergenciesController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public EmergenciesController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<Emergency>("SELECT * FROM Emergencies ORDER BY ReportedAt DESC");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<Emergency>(
            "SELECT * FROM Emergencies WHERE EmergencyId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Emergency e)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO Emergencies (Title, Description, Type, Severity, Status, Latitude, Longitude, Location, ReportedBy, AssignedTo)
                     VALUES (@Title, @Description, @Type, @Severity, @Status, @Latitude, @Longitude, @Location, @ReportedBy, @AssignedTo);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, e);
        return Ok(new { emergencyId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Emergency e)
    {
        using var conn = _db.CreateConnection();
        var sql = @"UPDATE Emergencies SET Title=@Title, Description=@Description, Type=@Type,
                     Severity=@Severity, Status=@Status, Latitude=@Latitude, Longitude=@Longitude,
                     Location=@Location, AssignedTo=@AssignedTo WHERE EmergencyId=@EmergencyId";
        e.EmergencyId = id;
        var affected = await conn.ExecuteAsync(sql, e);
        return affected == 0 ? NotFound() : Ok(new { message = "Updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM Emergencies WHERE EmergencyId = @id", new { id });
        return affected == 0 ? NotFound() : Ok(new { message = "Deleted." });
    }

    [HttpGet("active")]
    public async Task<IActionResult> GetActive()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_ActiveEmergencies ORDER BY Severity DESC");
        return Ok(rows);
    }
}
