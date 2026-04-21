using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ResourcesController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public ResourcesController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<Resource>("SELECT * FROM Resources ORDER BY Name");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<Resource>(
            "SELECT * FROM Resources WHERE ResourceId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Resource r)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO Resources (Name, Category, Quantity, Unit, Status, Location, EmergencyId)
                     VALUES (@Name, @Category, @Quantity, @Unit, @Status, @Location, @EmergencyId);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, r);
        return Ok(new { resourceId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Resource r)
    {
        using var conn = _db.CreateConnection();
        r.ResourceId = id;
        var sql = @"UPDATE Resources SET Name=@Name, Category=@Category, Quantity=@Quantity,
                     Unit=@Unit, Status=@Status, Location=@Location, EmergencyId=@EmergencyId
                     WHERE ResourceId=@ResourceId";
        var affected = await conn.ExecuteAsync(sql, r);
        return affected == 0 ? NotFound() : Ok(new { message = "Updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM Resources WHERE ResourceId = @id", new { id });
        return affected == 0 ? NotFound() : Ok(new { message = "Deleted." });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_ResourceSummary");
        return Ok(rows);
    }
}
