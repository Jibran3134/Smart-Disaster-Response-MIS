namespace DisasterResponseAPI.Models;

public class Emergency
{
    public int EmergencyId { get; set; }
    public string Title { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string Type { get; set; } = "Other";
    public string Severity { get; set; } = "Medium";
    public string Status { get; set; } = "Reported";
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public string? Location { get; set; }
    public int ReportedBy { get; set; }
    public int? AssignedTo { get; set; }
    public DateTime ReportedAt { get; set; }
    public DateTime? ResolvedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
