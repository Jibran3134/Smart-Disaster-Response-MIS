USE DisasterResponseDB;
GO
SET NOCOUNT ON;

PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
PRINT 'PHASE 1: QUERYING WITHOUT INDEXES (FULL TABLE SCAN)';
PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
-- Drop index if exists 
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_team_type_status')
    DROP INDEX idx_team_type_status ON Rescue_Team;

-- Clears the procedure cache
DBCC FREEPROCCACHE WITH NO_INFOMSGS
-- Clears the data cache
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;
-- Enables detailed tracking of CPU execution time milliseconds.
SET STATISTICS TIME ON;
-- Enables detailed tracking of physical disk reads and logical memory reads.
SET STATISTICS IO ON;
-- Without an index, SQL Server must check EVERY single row 
SELECT * FROM Rescue_Team WHERE team_type = 'Search & Rescue' AND availability_status = 'Available';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO

PRINT ' ';
PRINT '=======================================================';
PRINT 'PHASE 2: CREATING THE COMPOSITE INDEX';
PRINT '=======================================================';
PRINT 'Creating index introduces overhead on storage and writes, but optimizes reads...';
EXEC('CREATE INDEX idx_team_type_status ON Rescue_Team(team_type, availability_status)');
GO

PRINT ' ';
PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
PRINT 'PHASE 3: QUERYING WITH INDEXES (INDEX SEEK)';
PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
DBCC FREEPROCCACHE WITH NO_INFOMSGS;
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;
SET STATISTICS TIME ON;
SET STATISTICS IO ON;
SELECT * FROM Rescue_Team WHERE team_type = 'Search & Rescue' AND availability_status = 'Available';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
GO

PRINT ' ';
PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
PRINT 'PHASE 4: DEMONSTRATING INDEX OVERHEAD ON INSERTS';
PRINT '|||||||||||||||||||||||||||||||||||||||||||||||||||||||||';
SET STATISTICS TIME ON;
INSERT INTO Rescue_Team (team_name, team_type, availability_status) VALUES ('Overhead Test Team', 'Medical', 'Available');
SET STATISTICS TIME OFF;
DELETE FROM Rescue_Team WHERE team_name = 'Overhead Test Team';
GO
