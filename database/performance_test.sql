USE DisasterResponseDB;
GO
PRINT '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>';
PRINT 'TEST 1: DIRECT TABLE QUERY (RAW JOINS)';
PRINT '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>';
-- Clear memory cache to ensure a fair test
DBCC FREEPROCCACHE WITH NO_INFOMSGS;
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;

-- Turn on the stopwatch
SET STATISTICS TIME ON;

-- Running the complex raw query directly
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

-- Turn off the stopwatch
SET STATISTICS TIME OFF;
GO
PRINT '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>';
PRINT 'TEST 2: QUERYING USING THE VIEW';
PRINT '>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>';
-- Clear memory cache again for a fair test
DBCC FREEPROCCACHE WITH NO_INFOMSGS;
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;

-- Turn on the stopwatch
SET STATISTICS TIME ON;

-- Running the exact same data using our easy View
SELECT * FROM admin_view;

-- Turn off the stopwatch
SET STATISTICS TIME OFF;
GO
