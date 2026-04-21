namespace DisasterResponseAPI.Models;

public class Hospital
{
    public int HospitalId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public string? City { get; set; }
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public int TotalBeds { get; set; }
    public int AvailableBeds { get; set; }
    public string? Phone { get; set; }
    public string Status { get; set; } = "Operational";
    public DateTime UpdatedAt { get; set; }
}
