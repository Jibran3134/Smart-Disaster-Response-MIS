-- ============================================================
-- Smart Disaster Response MIS – Indexes
-- ============================================================

-- Users
CREATE INDEX IX_Users_Email      ON Users(Email);
CREATE INDEX IX_Users_Role       ON Users(Role);

-- Emergencies
CREATE INDEX IX_Emergencies_Status     ON Emergencies(Status);
CREATE INDEX IX_Emergencies_Type       ON Emergencies(Type);
CREATE INDEX IX_Emergencies_Severity   ON Emergencies(Severity);
CREATE INDEX IX_Emergencies_ReportedBy ON Emergencies(ReportedBy);
CREATE INDEX IX_Emergencies_AssignedTo ON Emergencies(AssignedTo);
CREATE INDEX IX_Emergencies_ReportedAt ON Emergencies(ReportedAt DESC);

-- Resources
CREATE INDEX IX_Resources_Category    ON Resources(Category);
CREATE INDEX IX_Resources_Status      ON Resources(Status);
CREATE INDEX IX_Resources_EmergencyId ON Resources(EmergencyId);

-- Teams
CREATE INDEX IX_Teams_Status       ON Teams(Status);
CREATE INDEX IX_Teams_EmergencyId  ON Teams(EmergencyId);
CREATE INDEX IX_Teams_LeaderId     ON Teams(LeaderId);

-- TeamMembers
CREATE INDEX IX_TeamMembers_UserId ON TeamMembers(UserId);

-- Hospitals
CREATE INDEX IX_Hospitals_Status ON Hospitals(Status);
CREATE INDEX IX_Hospitals_City   ON Hospitals(City);

-- FinancialTransactions
CREATE INDEX IX_Finance_EmergencyId ON FinancialTransactions(EmergencyId);
CREATE INDEX IX_Finance_Type        ON FinancialTransactions(Type);
CREATE INDEX IX_Finance_Status      ON FinancialTransactions(Status);
CREATE INDEX IX_Finance_Date        ON FinancialTransactions(TransactionDate DESC);

-- Approvals
CREATE INDEX IX_Approvals_Status      ON Approvals(Status);
CREATE INDEX IX_Approvals_EntityType  ON Approvals(EntityType);
CREATE INDEX IX_Approvals_RequestedBy ON Approvals(RequestedBy);

-- AuditLog
CREATE INDEX IX_AuditLog_UserId     ON AuditLog(UserId);
CREATE INDEX IX_AuditLog_EntityType ON AuditLog(EntityType);
CREATE INDEX IX_AuditLog_CreatedAt  ON AuditLog(CreatedAt DESC);
