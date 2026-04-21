namespace DisasterResponseAPI.Models;

public class Approval
{
    public int ApprovalId { get; set; }
    public string EntityType { get; set; } = string.Empty;
    public int EntityId { get; set; }
    public int RequestedBy { get; set; }
    public int? ReviewedBy { get; set; }
    public string Status { get; set; } = "Pending";
    public string? Comments { get; set; }
    public DateTime RequestedAt { get; set; }
    public DateTime? ReviewedAt { get; set; }
}
