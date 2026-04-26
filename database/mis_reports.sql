USE DisasterResponseDB;
-- 1. INCIDENT STATISTICS BY LOCATION & SEVERITY
-- Useful for identifying high-risk areas and plotting on a dashboard map.
SELECT 
    area_name AS Location, 
    severity AS SeverityLevel, 
    COUNT(report_id) AS Total_Incidents
FROM 
    Emergency_Report
GROUP BY 
    area_name, severity
ORDER BY 
    Total_Incidents DESC, area_name;
-- 2. RESOURCE UTILIZATION REPORTS
-- Shows which resources (Food, Medicine, etc.) are in highest demand.
SELECT 
    r.resource_name AS Resource, 
    r.resource_type AS Category, 
    SUM(ra.requested_qty) AS Total_Requested, 
    SUM(ISNULL(ra.approved_qty, 0)) AS Total_Approved,
    (SUM(ISNULL(ra.approved_qty, 0)) * 100.0 / NULLIF(SUM(ra.requested_qty), 0)) AS Fulfillment_Rate_Percentage
FROM 
    Resource_Allocation ra
JOIN 
    Resource r ON ra.resource_id = r.resource_id
JOIN 
    Allocation a ON ra.allocation_id = a.allocation_id
GROUP BY 
    r.resource_name, r.resource_type
ORDER BY 
    Total_Requested DESC;

-- 3. RESPONSE TIME ANALYTICS
-- Calculates average mission completion time for rescue teams in minutes/hours.
SELECT 
    t.team_name AS TeamName, 
    t.team_type AS Specialization, 
    COUNT(ta.report_id) AS Total_Missions_Completed,
    AVG(DATEDIFF(MINUTE, ta.assigned_at, ta.completed_at)) AS Avg_Completion_Time_Minutes
FROM 
    Team_Assignment ta
JOIN 
    Rescue_Team t ON ta.team_id = t.team_id
WHERE 
    ta.completed_at IS NOT NULL
GROUP BY 
    t.team_name, t.team_type
ORDER BY 
    Avg_Completion_Time_Minutes ASC;
-- 4. FINANCIAL SUMMARIES PER DISASTER
-- Compares allocated budgets vs actual expenses and incoming donations.
SELECT 
    de.event_name AS DisasterEvent,
    ISNULL(b.total_allocated, 0) AS Allocated_Budget,
    ISNULL(b.total_spent, 0) AS Total_Expenses,
    ISNULL(SUM(CASE WHEN ft.transaction_type = 'Donation' THEN ft.amount ELSE 0 END), 0) AS Total_Donations,
    ISNULL(b.remaining_balance, 0) AS Remaining_Budget
FROM 
    Disaster_Event de
LEFT JOIN 
    Budget b ON de.event_id = b.event_id
LEFT JOIN 
    Financial_Transaction ft ON de.event_id = ft.event_id
GROUP BY 
    de.event_name, b.total_allocated, b.total_spent, b.remaining_balance
ORDER BY 
    Total_Expenses DESC;
-- 5. APPROVAL WORKFLOW HISTORY REPORT
-- Tracks the timeline and status of systemic approval requests.
SELECT 
    status AS Approval_Status, 
    COUNT(*) AS Total_Requests
FROM 
    Approval_Request
GROUP BY 
    status;
SELECT 
    ar.request_type AS RequestType, 
    req_u.full_name AS RequestedBy, 
    ISNULL(app_u.full_name, 'Pending Assignment') AS ApprovedBy, 
    ar.status AS Status, 
    ar.request_time AS RequestDate
FROM 
    Approval_Request ar
JOIN 
    [Users] req_u ON ar.requested_by = req_u.user_id
LEFT JOIN 
    [Users] app_u ON ar.approved_by = app_u.user_id
ORDER BY 
    ar.request_time DESC;
