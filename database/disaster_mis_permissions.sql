USE DisasterResponseDB;
GO

-- ==============================================================================
-- 1. Create Database Roles
-- ==============================================================================
-- Drop roles if they already exist to avoid errors during re-runs
IF DATABASE_PRINCIPAL_ID('Finance_Role') IS NOT NULL DROP ROLE Finance_Role;
IF DATABASE_PRINCIPAL_ID('Field_Officer_Role') IS NOT NULL DROP ROLE Field_Officer_Role;
IF DATABASE_PRINCIPAL_ID('Warehouse_Role') IS NOT NULL DROP ROLE Warehouse_Role;
IF DATABASE_PRINCIPAL_ID('Admin_Role') IS NOT NULL DROP ROLE Admin_Role;
GO

CREATE ROLE Finance_Role;
CREATE ROLE Field_Officer_Role;
CREATE ROLE Warehouse_Role;
CREATE ROLE Admin_Role;
GO

-- ==============================================================================
-- 2. Restrict Sensitive Base Tables (Enforcing Security)
-- ==============================================================================

-- Block Field Officers and Warehouse staff from seeing financial transactions
DENY SELECT ON Financial_Transaction TO Field_Officer_Role, Warehouse_Role;
DENY SELECT ON [Users] TO Finance_Role, Field_Officer_Role, Warehouse_Role;
DENY SELECT ON Emergency_Report TO Finance_Role, Warehouse_Role;
DENY SELECT ON Inventory TO Finance_Role, Field_Officer_Role;
GO
-- ==============================================================================
-- 3. Grant Permissions to Views
-- ==============================================================================
-- Finance Officer gets access ONLY to the finance view
GRANT SELECT ON finance_view TO Finance_Role;
GRANT SELECT ON field_officer_view TO Field_Officer_Role;
GRANT SELECT ON warehouse_view TO Warehouse_Role;
GRANT SELECT ON admin_view TO Admin_Role;
GO

-- =============================================================================
-- 4. CREATE TEST USERS (FOR CHECKING)
-- =============================================================================
IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'FinanceUser')
    CREATE USER FinanceUser WITHOUT LOGIN;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'FieldUser')
    CREATE USER FieldUser WITHOUT LOGIN;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'WarehouseUser')
    CREATE USER WarehouseUser WITHOUT LOGIN;

IF NOT EXISTS (SELECT * FROM sys.database_principals WHERE name = 'AdminUser')
    CREATE USER AdminUser WITHOUT LOGIN;
GO

-- =============================================================================
-- 5. ASSIGN USERS TO ROLES
-- =============================================================================
ALTER ROLE Finance_Role ADD MEMBER FinanceUser;
ALTER ROLE Field_Officer_Role ADD MEMBER FieldUser;
ALTER ROLE Warehouse_Role ADD MEMBER WarehouseUser;
ALTER ROLE Admin_Role ADD MEMBER AdminUser;
GO

-- =============================================================================
-- 6. TEST CASES
-- =============================================================================

-- Should FAIL
EXECUTE AS USER = 'FinanceUser';
SELECT * FROM Users;
REVERT;

-- Should FAIL
EXECUTE AS USER = 'FieldUser';
SELECT * FROM Financial_Transaction;
REVERT;

-- Should FAIL
EXECUTE AS USER = 'WarehouseUser';
SELECT * FROM Emergency_Report;
REVERT;

-- Should WORK
EXECUTE AS USER = 'FinanceUser';
SELECT * FROM finance_view;
REVERT;

--  Should WORK
EXECUTE AS USER = 'FieldUser';
SELECT * FROM field_officer_view;
REVERT;

--  Should WORK
EXECUTE AS USER = 'WarehouseUser';
SELECT * FROM warehouse_view;
REVERT;

-- Should WORK
EXECUTE AS USER = 'AdminUser';
SELECT * FROM admin_view;
REVERT;
GO