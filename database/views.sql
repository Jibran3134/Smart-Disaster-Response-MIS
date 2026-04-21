-- ============================================================
-- Smart Disaster Response MIS – Views
-- ============================================================

-- 1. Active emergencies with reporter info
CREATE OR ALTER VIEW vw_ActiveEmergencies AS
SELECT e.EmergencyId, e.Title, e.Type, e.Severity, e.Status,
       e.Location, e.ReportedAt,
       u.FullName AS ReportedByName,
       a.FullName AS AssignedToName
FROM Emergencies e
JOIN Users u ON e.ReportedBy = u.UserId
LEFT JOIN Users a ON e.AssignedTo = a.UserId
WHERE e.Status NOT IN ('Resolved','Closed');
GO

-- 2. Resource inventory summary
CREATE OR ALTER VIEW vw_ResourceSummary AS
SELECT Category,
       COUNT(*) AS ItemCount,
       SUM(Quantity) AS TotalQuantity,
       SUM(CASE WHEN Status = 'Available' THEN Quantity ELSE 0 END) AS AvailableQty,
       SUM(CASE WHEN Status = 'Deployed'  THEN Quantity ELSE 0 END) AS DeployedQty
FROM Resources
GROUP BY Category;
GO

-- 3. Team deployment status
CREATE OR ALTER VIEW vw_TeamDeployment AS
SELECT t.TeamId, t.TeamName, t.Specialization, t.Status,
       t.MemberCount, t.DeployedAt,
       e.Title AS EmergencyTitle, e.Severity,
       u.FullName AS LeaderName
FROM Teams t
LEFT JOIN Emergencies e ON t.EmergencyId = e.EmergencyId
LEFT JOIN Users u ON t.LeaderId = u.UserId;
GO

-- 4. Hospital capacity overview
CREATE OR ALTER VIEW vw_HospitalCapacity AS
SELECT HospitalId, Name, City, Status,
       TotalBeds, AvailableBeds,
       TotalBeds - AvailableBeds AS OccupiedBeds,
       CAST(ROUND(
           CASE WHEN TotalBeds > 0
                THEN ((TotalBeds - AvailableBeds) * 100.0 / TotalBeds)
                ELSE 0 END, 1) AS DECIMAL(5,1)) AS OccupancyPct
FROM Hospitals;
GO

-- 5. Financial summary per emergency
CREATE OR ALTER VIEW vw_FinanceSummary AS
SELECT e.EmergencyId, e.Title,
       SUM(CASE WHEN ft.Type = 'Allocation'   THEN ft.Amount ELSE 0 END) AS TotalAllocated,
       SUM(CASE WHEN ft.Type = 'Expenditure'  THEN ft.Amount ELSE 0 END) AS TotalSpent,
       SUM(CASE WHEN ft.Type = 'Donation'     THEN ft.Amount ELSE 0 END) AS TotalDonations,
       COUNT(ft.TransactionId) AS TransactionCount
FROM Emergencies e
LEFT JOIN FinancialTransactions ft ON e.EmergencyId = ft.EmergencyId
GROUP BY e.EmergencyId, e.Title;
GO

-- 6. Pending approvals with requester info
CREATE OR ALTER VIEW vw_PendingApprovals AS
SELECT a.ApprovalId, a.EntityType, a.EntityId, a.Status,
       a.Comments, a.RequestedAt,
       u.FullName AS RequestedByName, u.Role AS RequesterRole
FROM Approvals a
JOIN Users u ON a.RequestedBy = u.UserId
WHERE a.Status = 'Pending';
GO

-- 7. Audit trail view
CREATE OR ALTER VIEW vw_AuditTrail AS
SELECT al.LogId, al.Action, al.EntityType, al.EntityId,
       al.Details, al.CreatedAt,
       u.FullName AS UserName, u.Role
FROM AuditLog al
LEFT JOIN Users u ON al.UserId = u.UserId;
GO

-- 8. Emergency response dashboard (aggregated)
CREATE OR ALTER VIEW vw_DashboardStats AS
SELECT
    (SELECT COUNT(*) FROM Emergencies WHERE Status NOT IN ('Resolved','Closed')) AS ActiveEmergencies,
    (SELECT COUNT(*) FROM Teams WHERE Status = 'Deployed')                      AS DeployedTeams,
    (SELECT SUM(AvailableBeds) FROM Hospitals WHERE Status <> 'Closed')         AS TotalAvailableBeds,
    (SELECT COUNT(*) FROM Approvals WHERE Status = 'Pending')                   AS PendingApprovals,
    (SELECT ISNULL(SUM(Amount),0) FROM FinancialTransactions WHERE Type = 'Allocation' AND Status IN ('Approved','Completed')) AS TotalFundsAllocated,
    (SELECT ISNULL(SUM(Amount),0) FROM FinancialTransactions WHERE Type = 'Expenditure' AND Status IN ('Approved','Completed')) AS TotalFundsSpent;
GO
