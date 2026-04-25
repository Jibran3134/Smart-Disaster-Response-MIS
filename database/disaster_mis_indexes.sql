USE DisasterResponseDB;
GO

--|||||||||||||||||||||||||||||||||||||||||||
-- 1. SINGLE-COLUMN INDEXES
--|||||||||||||||||||||||||||||||||||||||||||
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_area')
    CREATE INDEX idx_emergency_area ON Emergency_Report(area_name);


IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_disaster_type')
    CREATE INDEX idx_disaster_type ON Disaster_Event(disaster_type);

IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_resource_type')
    CREATE INDEX idx_resource_type ON Resource(resource_type);

-- Index on Transaction Timestamp
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_transaction_date')
    CREATE INDEX idx_transaction_date ON Financial_Transaction(transaction_date);


--|||||||||||||||||||||||||||||||||||||||||||
-- 2. COMPOSITE INDEXES
--|||||||||||||||||||||||||||||||||||||||||||
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_emergency_event_severity')
    CREATE INDEX idx_emergency_event_severity ON Emergency_Report(event_id, severity);
-- Index on (team_type, availability_status)
IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'idx_team_type_status')
    CREATE INDEX idx_team_type_status ON Rescue_Team(team_type, availability_status);
GO
