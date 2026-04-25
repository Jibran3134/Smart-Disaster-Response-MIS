USE DisasterResponseDB;
GO

-- Drop existing views if they exist
IF OBJECT_ID('finance_view', 'V') IS NOT NULL DROP VIEW finance_view;
IF OBJECT_ID('field_officer_view', 'V') IS NOT NULL DROP VIEW field_officer_view;
IF OBJECT_ID('warehouse_view', 'V') IS NOT NULL DROP VIEW warehouse_view;
IF OBJECT_ID('admin_view', 'V') IS NOT NULL DROP VIEW admin_view;
GO

-- ==========================================
-- 1. finance_view (Transactions Only)
-- ==========================================
CREATE VIEW finance_view AS
SELECT 
    ft.transaction_id,
    ft.amount,
    ft.transaction_type,
    ft.status,
    ft.transaction_date,
    u.full_name AS performed_by_user,
    d.donor_name,
    de.event_name
FROM Financial_Transaction ft
LEFT JOIN [Users] u ON ft.made_by_user = u.user_id --USER IS RESERVED WORD
LEFT JOIN Donor d ON ft.made_by_donor = d.donor_id
LEFT JOIN Disaster_Event de ON ft.event_id = de.event_id;
GO

-- ==========================================
-- 2. field_officer_view (Teams + Emergencies)
-- ==========================================
CREATE VIEW field_officer_view AS
SELECT 
    er.report_id,
    er.area_name,
    er.severity,
    er.status,
    de.event_name,
    de.disaster_type,
    rt.team_name,
    rt.team_type,
    rt.availability_status
FROM Emergency_Report er
JOIN Disaster_Event de ON er.event_id = de.event_id
LEFT JOIN Team_Assignment ta ON er.report_id = ta.report_id
LEFT JOIN Rescue_Team rt ON ta.team_id = rt.team_id;
GO

-- ==========================================
-- 3. warehouse_view (Inventory Only)
-- ==========================================
CREATE VIEW warehouse_view AS
SELECT 
    w.warehouse_name,
    w.city,
    r.resource_name,
    r.resource_type,
    i.quantity_available,
    i.threshold_level
FROM Inventory i
JOIN Warehouse w ON i.warehouse_id = w.warehouse_id
JOIN Resource r ON i.resource_id = r.resource_id;
GO

-- ==========================================
-- 4. admin_view (Full Dashboard)
-- ==========================================
CREATE VIEW admin_view AS
SELECT 
    u.user_id,
    u.full_name,
    r.role_name,
    de.event_name,
    de.status AS event_status,
    ft.amount,
    ft.transaction_type,
    w.warehouse_name,
    i.quantity_available
FROM [Users] u
JOIN Role r ON u.role_id = r.role_id
LEFT JOIN Financial_Transaction ft ON u.user_id = ft.made_by_user
LEFT JOIN Disaster_Event de ON ft.event_id = de.event_id
LEFT JOIN Warehouse w ON u.user_id = w.managed_by
LEFT JOIN Inventory i ON w.warehouse_id = i.warehouse_id;
GO
