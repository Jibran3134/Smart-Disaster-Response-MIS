namespace DisasterResponseAPI.Models;

public class FinancialTransaction
{
    public int TransactionId { get; set; }
    public int? EmergencyId { get; set; }
    public string Type { get; set; } = "Expenditure";
    public decimal Amount { get; set; }
    public string Currency { get; set; } = "USD";
    public string? Description { get; set; }
    public int? ApprovedBy { get; set; }
    public string Status { get; set; } = "Pending";
    public DateTime TransactionDate { get; set; }
    public DateTime CreatedAt { get; set; }
}
