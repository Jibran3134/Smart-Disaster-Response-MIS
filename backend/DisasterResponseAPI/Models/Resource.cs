namespace DisasterResponseAPI.Models;

public class Resource
{
    public int ResourceId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Category { get; set; } = "Other";
    public int Quantity { get; set; }
    public string Unit { get; set; } = "Units";
    public string Status { get; set; } = "Available";
    public string? Location { get; set; }
    public int? EmergencyId { get; set; }
    public DateTime UpdatedAt { get; set; }
}
