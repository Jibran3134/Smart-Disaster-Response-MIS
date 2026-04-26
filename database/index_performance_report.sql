USE DisasterResponseDB;
GO
SET NOCOUNT ON;
PRINT 'PHASE 1: QUERYING WITHOUT INDEXES (FULL TABLE SCAN)';
IF EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_perf_disaster_type')
    DROP INDEX idx_perf_disaster_type ON Disaster_Event;
-- Clears the procedure and data cache for a fair test
DBCC FREEPROCCACHE WITH NO_INFOMSGS;
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;
-- Enables detailed tracking of CPU time and Logical Reads
SET STATISTICS TIME ON;
SET STATISTICS IO ON;
SELECT * FROM Disaster_Event WHERE disaster_type = 'Flood';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Earthquake';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Fire';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Hurricane';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Tornado';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Flood';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Earthquake';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Fire';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Hurricane';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Tornado';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
PRINT 'PHASE 2: CREATING THE INDEX';      
SET STATISTICS TIME ON;
CREATE INDEX idx_perf_disaster_type
ON Disaster_Event (disaster_type);
SET STATISTICS TIME OFF;
PRINT 'PHASE 3: QUERYING WITH INDEXES (INDEX SEEK)';
-- Clears the procedure and data cache for a fair test
DBCC FREEPROCCACHE WITH NO_INFOMSGS;
DBCC DROPCLEANBUFFERS WITH NO_INFOMSGS;
SET STATISTICS TIME ON;
SET STATISTICS IO ON;

-- We run the EXACT SAME 10 queries as we did in Phase 1
SELECT * FROM Disaster_Event WHERE disaster_type = 'Flood';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Earthquake';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Fire';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Hurricane';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Tornado';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Flood';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Earthquake';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Fire';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Hurricane';
SELECT * FROM Disaster_Event WHERE disaster_type = 'Tornado';
SET STATISTICS IO OFF;
SET STATISTICS TIME OFF;
PRINT 'PHASE 4:INDEX OVERHEAD ON INSERTS';
SET STATISTICS TIME ON;
INSERT INTO Disaster_Event (event_name, disaster_type, affected_areas, start_date, status) 
VALUES ('Overhead Test Event', 'Other', 'Test Area', GETDATE(), 'Active');
SET STATISTICS TIME OFF;
DELETE FROM Disaster_Event WHERE event_name = 'Overhead Test Event';
GO
