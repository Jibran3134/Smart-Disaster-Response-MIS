-- ============================================================
-- Smart Disaster Response MIS – Triggers
-- ============================================================

-- 1. Auto-update UpdatedAt on Users
CREATE OR ALTER TRIGGER trg_Users_UpdateTimestamp
ON Users AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Users SET UpdatedAt = SYSDATETIME()
    FROM Users u INNER JOIN inserted i ON u.UserId = i.UserId;
END;
GO

-- 2. Auto-update UpdatedAt on Emergencies
CREATE OR ALTER TRIGGER trg_Emergencies_UpdateTimestamp
ON Emergencies AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Emergencies SET UpdatedAt = SYSDATETIME()
    FROM Emergencies e INNER JOIN inserted i ON e.EmergencyId = i.EmergencyId;
END;
GO

-- 3. Set ResolvedAt when Emergency → Resolved
CREATE OR ALTER TRIGGER trg_Emergencies_Resolved
ON Emergencies AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Emergencies SET ResolvedAt = SYSDATETIME()
    FROM Emergencies e
    INNER JOIN inserted i ON e.EmergencyId = i.EmergencyId
    INNER JOIN deleted  d ON e.EmergencyId = d.EmergencyId
    WHERE i.Status = 'Resolved' AND d.Status <> 'Resolved';
END;
GO

-- 4. Auto-update UpdatedAt on Resources
CREATE OR ALTER TRIGGER trg_Resources_UpdateTimestamp
ON Resources AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Resources SET UpdatedAt = SYSDATETIME()
    FROM Resources r INNER JOIN inserted i ON r.ResourceId = i.ResourceId;
END;
GO

-- 5. Auto-update UpdatedAt on Hospitals
CREATE OR ALTER TRIGGER trg_Hospitals_UpdateTimestamp
ON Hospitals AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Hospitals SET UpdatedAt = SYSDATETIME()
    FROM Hospitals h INNER JOIN inserted i ON h.HospitalId = i.HospitalId;
END;
GO

-- 6. Recalculate MemberCount on insert
CREATE OR ALTER TRIGGER trg_TeamMembers_CountInsert
ON TeamMembers AFTER INSERT
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Teams
    SET MemberCount = (SELECT COUNT(*) FROM TeamMembers WHERE TeamId = Teams.TeamId)
    WHERE TeamId IN (SELECT DISTINCT TeamId FROM inserted);
END;
GO

-- 7. Recalculate MemberCount on delete
CREATE OR ALTER TRIGGER trg_TeamMembers_CountDelete
ON TeamMembers AFTER DELETE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE Teams
    SET MemberCount = (SELECT COUNT(*) FROM TeamMembers WHERE TeamId = Teams.TeamId)
    WHERE TeamId IN (SELECT DISTINCT TeamId FROM deleted);
END;
GO

-- 8. Audit-log for Financial Transactions
CREATE OR ALTER TRIGGER trg_Finance_AuditLog
ON FinancialTransactions AFTER INSERT, UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    INSERT INTO AuditLog (UserId, Action, EntityType, EntityId, Details)
    SELECT i.ApprovedBy,
        CASE WHEN EXISTS (SELECT 1 FROM deleted) THEN 'UPDATE' ELSE 'INSERT' END,
        'FinancialTransaction', i.TransactionId,
        CONCAT('Type=', i.Type, ' Amount=', i.Amount, ' Status=', i.Status)
    FROM inserted i;
END;
GO

-- 9. Prevent deleting a user leading active teams
CREATE OR ALTER TRIGGER trg_Users_PreventDeleteLeader
ON Users INSTEAD OF DELETE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (
        SELECT 1 FROM Teams t INNER JOIN deleted d ON t.LeaderId = d.UserId
        WHERE t.Status IN ('Deployed','Standby')
    )
    BEGIN
        RAISERROR('Cannot delete user leading an active team.', 16, 1);
        RETURN;
    END;
    DELETE FROM Users WHERE UserId IN (SELECT UserId FROM deleted);
END;
GO

-- 10. Prevent hospital bed over-allocation
CREATE OR ALTER TRIGGER trg_Hospitals_BedCheck
ON Hospitals AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    IF EXISTS (SELECT 1 FROM inserted WHERE AvailableBeds > TotalBeds)
    BEGIN
        RAISERROR('Available beds cannot exceed total beds.', 16, 1);
        ROLLBACK TRANSACTION;
    END;
END;
GO
