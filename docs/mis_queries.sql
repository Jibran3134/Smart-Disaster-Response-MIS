-- ============================================================
-- Smart Disaster Response MIS – Key MIS Queries
-- ============================================================

-- Q1: Dashboard KPIs
SELECT * FROM vw_DashboardStats;

-- Q2: All active emergencies with assignee
SELECT * FROM vw_ActiveEmergencies ORDER BY Severity DESC, ReportedAt DESC;

-- Q3: Resource inventory by category
SELECT * FROM vw_ResourceSummary ORDER BY Category;

-- Q4: Deployed teams and their emergencies
SELECT * FROM vw_TeamDeployment WHERE Status = 'Deployed';

-- Q5: Hospital capacity – sorted by occupancy
SELECT * FROM vw_HospitalCapacity ORDER BY OccupancyPct DESC;

-- Q6: Financial summary per emergency
SELECT * FROM vw_FinanceSummary WHERE TotalAllocated > 0 ORDER BY TotalAllocated DESC;

-- Q7: Pending approvals
SELECT * FROM vw_PendingApprovals ORDER BY RequestedAt ASC;

-- Q8: Emergencies reported in the last 7 days
SELECT EmergencyId, Title, Type, Severity, Status, Location, ReportedAt
FROM Emergencies
WHERE ReportedAt >= DATEADD(DAY, -7, SYSDATETIME())
ORDER BY ReportedAt DESC;

-- Q9: Top 5 resource categories by deployed quantity
SELECT TOP 5 Category, SUM(Quantity) AS DeployedQty
FROM Resources
WHERE Status = 'Deployed'
GROUP BY Category
ORDER BY DeployedQty DESC;

-- Q10: Users with most emergency assignments
SELECT u.UserId, u.FullName, u.Role, COUNT(e.EmergencyId) AS AssignmentCount
FROM Users u
JOIN Emergencies e ON u.UserId = e.AssignedTo
GROUP BY u.UserId, u.FullName, u.Role
ORDER BY AssignmentCount DESC;

-- Q11: Total expenditure vs allocation per emergency
SELECT e.Title,
    SUM(CASE WHEN ft.Type='Allocation'  THEN ft.Amount ELSE 0 END) AS Allocated,
    SUM(CASE WHEN ft.Type='Expenditure' THEN ft.Amount ELSE 0 END) AS Spent,
    SUM(CASE WHEN ft.Type='Allocation'  THEN ft.Amount ELSE 0 END)
  - SUM(CASE WHEN ft.Type='Expenditure' THEN ft.Amount ELSE 0 END) AS Remaining
FROM Emergencies e
JOIN FinancialTransactions ft ON e.EmergencyId = ft.EmergencyId
GROUP BY e.Title;

-- Q12: Recent audit trail (last 50 entries)
SELECT TOP 50 * FROM vw_AuditTrail ORDER BY CreatedAt DESC;

-- Q13: Hospitals with < 10% bed availability
SELECT Name, City, AvailableBeds, TotalBeds, OccupancyPct
FROM vw_HospitalCapacity
WHERE OccupancyPct >= 90;

-- Q14: Teams available for immediate deployment
SELECT TeamId, TeamName, Specialization, MemberCount
FROM Teams
WHERE Status = 'Available' AND MemberCount >= 3;

-- Q15: Monthly transaction volume
SELECT FORMAT(TransactionDate, 'yyyy-MM') AS Month,
       COUNT(*) AS TxnCount,
       SUM(Amount) AS TotalAmount
FROM FinancialTransactions
GROUP BY FORMAT(TransactionDate, 'yyyy-MM')
ORDER BY Month DESC;
