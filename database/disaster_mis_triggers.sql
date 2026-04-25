USE DisasterResponseDB;
GO

-- Drop existing triggers to keep it clean
IF OBJECT_ID('trg_update_inventory', 'TR') IS NOT NULL DROP TRIGGER trg_update_inventory;
IF OBJECT_ID('trg_update_team_status', 'TR') IS NOT NULL DROP TRIGGER trg_update_team_status;
IF OBJECT_ID('trg_audit_financial_transaction', 'TR') IS NOT NULL DROP TRIGGER trg_audit_financial_transaction;
IF OBJECT_ID('trg_prevent_negative_inventory', 'TR') IS NOT NULL DROP TRIGGER trg_prevent_negative_inventory;
GO

-- ------------------------------------------------------------------------------
-- 1. Auto-update resource stock
-- ------------------------------------------------------------------------------
CREATE TRIGGER trg_update_inventory
ON Resource_Allocation
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT (new allocation approval)
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        UPDATE i
        SET i.quantity_available = i.quantity_available - ISNULL(ins.approved_qty, 0)
        FROM Inventory i
        INNER JOIN inserted ins ON i.resource_id = ins.resource_id
        INNER JOIN Allocation a ON ins.allocation_id = a.allocation_id
        WHERE i.warehouse_id = a.warehouse_id
          AND ins.approved_qty IS NOT NULL;
    END

    -- DELETE (rollback stock)
    IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        UPDATE i
        SET i.quantity_available = i.quantity_available + ISNULL(del.approved_qty, 0)
        FROM Inventory i
        INNER JOIN deleted del ON i.resource_id = del.resource_id
        INNER JOIN Allocation a ON del.allocation_id = a.allocation_id
        WHERE i.warehouse_id = a.warehouse_id;
    END

    -- UPDATE (adjust difference)
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        UPDATE i
        SET i.quantity_available = i.quantity_available 
                                 + ISNULL(del.approved_qty, 0)
                                 - ISNULL(ins.approved_qty, 0)
        FROM Inventory i
        INNER JOIN inserted ins 
            ON i.resource_id = ins.resource_id
        INNER JOIN deleted del 
            ON ins.resource_id = del.resource_id 
           AND ins.allocation_id = del.allocation_id
        INNER JOIN Allocation a 
            ON ins.allocation_id = a.allocation_id
        WHERE i.warehouse_id = a.warehouse_id;
    END
END;
GO

-- ------------------------------------------------------------------------------
-- 2. Update rescue team status
-- ------------------------------------------------------------------------------
CREATE TRIGGER trg_update_team_status
ON Team_Assignment
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- NEW assignment -> Assigned
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        UPDATE rt
        SET rt.availability_status = 'Assigned'
        FROM Rescue_Team rt
        INNER JOIN inserted ins ON rt.team_id = ins.team_id;
    END

    -- Any change -> recalculate status properly
    IF EXISTS (SELECT * FROM inserted) OR EXISTS (SELECT * FROM deleted)
    BEGIN
        UPDATE rt
        SET availability_status =
            CASE 
                WHEN EXISTS (
                    SELECT 1 
                    FROM Team_Assignment ta
                    WHERE ta.team_id = rt.team_id
                      AND ta.completed_at IS NULL
                )
                THEN 'Assigned'
                ELSE 'Available'
            END
        FROM Rescue_Team rt;
    END
END;
GO

-- ------------------------------------------------------------------------------
-- 3. Log financial transactions to audit table
-- ------------------------------------------------------------------------------
CREATE TRIGGER trg_audit_financial_transaction
ON Financial_Transaction
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- INSERT
    IF EXISTS (SELECT * FROM inserted) AND NOT EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO Audit_Log (user_id, record_id, action_type, table_name, old_value, new_value)
        SELECT 
            ISNULL(made_by_user, 0),
            transaction_id,
            'INSERT',
            'Financial_Transaction',
            NULL,
            CONCAT('Amount: ', amount, ', Status: ', status)
        FROM inserted;
    END

    -- UPDATE
    IF EXISTS (SELECT * FROM inserted) AND EXISTS (SELECT * FROM deleted)
    BEGIN
        INSERT INTO Audit_Log (user_id, record_id, action_type, table_name, old_value, new_value)
        SELECT 
            ISNULL(ins.made_by_user, 0),
            ins.transaction_id,
            'UPDATE',
            'Financial_Transaction',
            CONCAT('Amount: ', del.amount, ', Status: ', del.status),
            CONCAT('Amount: ', ins.amount, ', Status: ', ins.status)
        FROM inserted ins
        INNER JOIN deleted del ON ins.transaction_id = del.transaction_id;
    END

    -- DELETE
    IF EXISTS (SELECT * FROM deleted) AND NOT EXISTS (SELECT * FROM inserted)
    BEGIN
        INSERT INTO Audit_Log (user_id, record_id, action_type, table_name, old_value, new_value)
        SELECT 
            ISNULL(made_by_user, 0),
            transaction_id,
            'DELETE',
            'Financial_Transaction',
            CONCAT('Amount: ', amount, ', Status: ', status),
            NULL
        FROM deleted;
    END
END;
GO

-- ------------------------------------------------------------------------------
-- 4. Prevent negative inventory
-- ------------------------------------------------------------------------------
CREATE TRIGGER trg_prevent_negative_inventory
ON Inventory
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF EXISTS (SELECT * FROM inserted WHERE quantity_available < 0)
    BEGIN
        ROLLBACK TRANSACTION;
        THROW 50000, 'Inventory cannot go below zero!', 1;
    END
END;
GO
