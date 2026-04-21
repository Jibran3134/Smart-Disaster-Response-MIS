namespace DisasterResponseAPI.Models;

public class Team
{
    public int TeamId { get; set; }
    public string TeamName { get; set; } = string.Empty;
    public string Specialization { get; set; } = "General";
    public string Status { get; set; } = "Available";
    public int? LeaderId { get; set; }
    public int MemberCount { get; set; }
    public int? EmergencyId { get; set; }
    public DateTime? DeployedAt { get; set; }
    public DateTime CreatedAt { get; set; }
}
