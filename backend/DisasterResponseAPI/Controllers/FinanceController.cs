using Dapper;
using DisasterResponseAPI.Config;
using DisasterResponseAPI.Models;
using Microsoft.AspNetCore.Mvc;

namespace DisasterResponseAPI.Controllers;

[ApiController]
[Route("api/[controller]")]
public class FinanceController : ControllerBase
{
    private readonly SqlConnectionFactory _db;
    public FinanceController(SqlConnectionFactory db) => _db = db;

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync<FinancialTransaction>(
            "SELECT * FROM FinancialTransactions ORDER BY TransactionDate DESC");
        return Ok(rows);
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        using var conn = _db.CreateConnection();
        var row = await conn.QueryFirstOrDefaultAsync<FinancialTransaction>(
            "SELECT * FROM FinancialTransactions WHERE TransactionId = @id", new { id });
        return row == null ? NotFound() : Ok(row);
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] FinancialTransaction ft)
    {
        using var conn = _db.CreateConnection();
        var sql = @"INSERT INTO FinancialTransactions (EmergencyId, Type, Amount, Currency, Description, ApprovedBy, Status)
                     VALUES (@EmergencyId, @Type, @Amount, @Currency, @Description, @ApprovedBy, @Status);
                     SELECT CAST(SCOPE_IDENTITY() AS INT);";
        var id = await conn.QuerySingleAsync<int>(sql, ft);
        return Ok(new { transactionId = id });
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] FinancialTransaction ft)
    {
        using var conn = _db.CreateConnection();
        ft.TransactionId = id;
        var sql = @"UPDATE FinancialTransactions SET EmergencyId=@EmergencyId, Type=@Type,
                     Amount=@Amount, Currency=@Currency, Description=@Description,
                     ApprovedBy=@ApprovedBy, Status=@Status WHERE TransactionId=@TransactionId";
        var affected = await conn.ExecuteAsync(sql, ft);
        return affected == 0 ? NotFound() : Ok(new { message = "Updated." });
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        using var conn = _db.CreateConnection();
        var affected = await conn.ExecuteAsync(
            "DELETE FROM FinancialTransactions WHERE TransactionId = @id", new { id });
        return affected == 0 ? NotFound() : Ok(new { message = "Deleted." });
    }

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary()
    {
        using var conn = _db.CreateConnection();
        var rows = await conn.QueryAsync("SELECT * FROM vw_FinanceSummary");
        return Ok(rows);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        using var conn = _db.CreateConnection();
        var stats = await conn.QueryFirstOrDefaultAsync("SELECT * FROM vw_DashboardStats");
        return Ok(stats);
    }
}
