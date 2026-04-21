using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class HospitalsController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public HospitalsController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<Hospital>("SELECT * FROM Hospitals ORDER BY Name");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<Hospital>(
            "SELECT * FROM Hospitals WHERE HospitalId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] Hospital h)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO Hospitals (Name, Address, City, Latitude, Longitude, TotalBeds, AvailableBeds, Phone, Status)
                     VALUES (@Name, @Address, @City, @Latitude, @Longitude, @TotalBeds, @AvailableBeds, @Phone, @Status);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, h);
        return Ok(new { hospitalId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] Hospital h)
    {
        using var conn = _db.CreateConnection();
        h.HospitalId = id;
        var sql = @"UPDATE Hospitals SET Name=@Name, Address=@Address, City=@City,
                     Latitude=@Latitude, Longitude=@Longitude, TotalBeds=@TotalBeds,
                     AvailableBeds=@AvailableBeds, Phone=@Phone, Status=@Status
                     WHERE HospitalId=@HospitalId";
        var affected = await conn.ExecuteAsync(sql, h);
        return affected == 0 ? NotFound() : Ok(new { message = "Updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync("DELETE FROM Hospitals WHERE HospitalId = @id", new { id });
        return affected == 0 ? NotFound() : Ok(new { message = "Deleted." });
    }

    [HttpGet("capacity")]
    public async Task<IActionResult> GetCapacity()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_HospitalCapacity ORDER BY OccupancyPct DESC");
        return Ok(rows);
    }
}
