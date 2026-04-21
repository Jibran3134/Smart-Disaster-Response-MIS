-- ============================================================
-- Smart Disaster Response MIS – Schema Definition
-- Target: SQL Server 2019+
-- ============================================================

-- 1. Users & Authentication
CREATE TABLE Users (
    UserId        INT IDENTITY(1,1) PRIMARY KEY,
    FullName      NVARCHAR(120)  NOT NULL,
    Email         NVARCHAR(200)  NOT NULL UNIQUE,
    PasswordHash  NVARCHAR(256)  NOT NULL,
    Role          NVARCHAR(30)   NOT NULL
                  CHECK (Role IN ('Admin','Coordinator','Responder','Medical','Finance')),
    Phone         NVARCHAR(20),
    IsActive      BIT            NOT NULL DEFAULT 1,
    CreatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    UpdatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 2. Emergency Events
CREATE TABLE Emergencies (
    EmergencyId   INT IDENTITY(1,1) PRIMARY KEY,
    Title         NVARCHAR(200)  NOT NULL,
    Description   NVARCHAR(MAX),
    Type          NVARCHAR(50)   NOT NULL
                  CHECK (Type IN ('Earthquake','Flood','Fire','Hurricane','Pandemic','Industrial','Other')),
    Severity      NVARCHAR(20)   NOT NULL
                  CHECK (Severity IN ('Low','Medium','High','Critical')),
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Reported'
                  CHECK (Status IN ('Reported','Acknowledged','InProgress','Resolved','Closed')),
    Latitude      DECIMAL(9,6),
    Longitude     DECIMAL(9,6),
    Location      NVARCHAR(300),
    ReportedBy    INT            NOT NULL REFERENCES Users(UserId),
    AssignedTo    INT            NULL     REFERENCES Users(UserId),
    ReportedAt    DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    ResolvedAt    DATETIME2      NULL,
    UpdatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 3. Resources / Supplies
CREATE TABLE Resources (
    ResourceId    INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(150)  NOT NULL,
    Category      NVARCHAR(60)   NOT NULL
                  CHECK (Category IN ('Medical','Food','Shelter','Vehicle','Equipment','Communication','Other')),
    Quantity      INT            NOT NULL DEFAULT 0,
    Unit          NVARCHAR(30)   NOT NULL DEFAULT 'Units',
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Available'
                  CHECK (Status IN ('Available','Deployed','Depleted','Maintenance')),
    Location      NVARCHAR(300),
    EmergencyId   INT            NULL     REFERENCES Emergencies(EmergencyId),
    UpdatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 4. Response Teams
CREATE TABLE Teams (
    TeamId        INT IDENTITY(1,1) PRIMARY KEY,
    TeamName      NVARCHAR(120)  NOT NULL,
    Specialization NVARCHAR(60)  NOT NULL
                  CHECK (Specialization IN ('Search & Rescue','Medical','Logistics','Communications','Hazmat','General')),
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Available'
                  CHECK (Status IN ('Available','Deployed','Standby','Unavailable')),
    LeaderId      INT            NULL     REFERENCES Users(UserId),
    MemberCount   INT            NOT NULL DEFAULT 0,
    EmergencyId   INT            NULL     REFERENCES Emergencies(EmergencyId),
    DeployedAt    DATETIME2      NULL,
    CreatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 5. Team Members (junction)
CREATE TABLE TeamMembers (
    TeamMemberId  INT IDENTITY(1,1) PRIMARY KEY,
    TeamId        INT NOT NULL REFERENCES Teams(TeamId),
    UserId        INT NOT NULL REFERENCES Users(UserId),
    JoinedAt      DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
    UNIQUE (TeamId, UserId)
);

-- 6. Hospitals
CREATE TABLE Hospitals (
    HospitalId    INT IDENTITY(1,1) PRIMARY KEY,
    Name          NVARCHAR(200)  NOT NULL,
    Address       NVARCHAR(400),
    City          NVARCHAR(100),
    Latitude      DECIMAL(9,6),
    Longitude     DECIMAL(9,6),
    TotalBeds     INT            NOT NULL DEFAULT 0,
    AvailableBeds INT            NOT NULL DEFAULT 0,
    Phone         NVARCHAR(30),
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Operational'
                  CHECK (Status IN ('Operational','Full','Limited','Closed')),
    UpdatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 7. Financial Transactions
CREATE TABLE FinancialTransactions (
    TransactionId INT IDENTITY(1,1) PRIMARY KEY,
    EmergencyId   INT            NULL     REFERENCES Emergencies(EmergencyId),
    Type          NVARCHAR(30)   NOT NULL
                  CHECK (Type IN ('Allocation','Expenditure','Donation','Reimbursement')),
    Amount        DECIMAL(18,2)  NOT NULL,
    Currency      NVARCHAR(3)    NOT NULL DEFAULT 'USD',
    Description   NVARCHAR(500),
    ApprovedBy    INT            NULL     REFERENCES Users(UserId),
    Status        NVARCHAR(30)   NOT NULL DEFAULT 'Pending'
                  CHECK (Status IN ('Pending','Approved','Rejected','Completed')),
    TransactionDate DATETIME2    NOT NULL DEFAULT SYSDATETIME(),
    CreatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);

-- 8. Approvals / Workflow
CREATE TABLE Approvals (
    ApprovalId    INT IDENTITY(1,1) PRIMARY KEY,
    EntityType    NVARCHAR(50)   NOT NULL
                  CHECK (EntityType IN ('Emergency','Resource','Financial','Team')),
    EntityId      INT            NOT NULL,
    RequestedBy   INT            NOT NULL REFERENCES Users(UserId),
    ReviewedBy    INT            NULL     REFERENCES Users(UserId),
    Status        NVARCHAR(20)   NOT NULL DEFAULT 'Pending'
                  CHECK (Status IN ('Pending','Approved','Rejected')),
    Comments      NVARCHAR(1000),
    RequestedAt   DATETIME2      NOT NULL DEFAULT SYSDATETIME(),
    ReviewedAt    DATETIME2      NULL
);

-- 9. Audit Log
CREATE TABLE AuditLog (
    LogId         INT IDENTITY(1,1) PRIMARY KEY,
    UserId        INT            NULL     REFERENCES Users(UserId),
    Action        NVARCHAR(100)  NOT NULL,
    EntityType    NVARCHAR(50),
    EntityId      INT,
    Details       NVARCHAR(MAX),
    IpAddress     NVARCHAR(45),
    CreatedAt     DATETIME2      NOT NULL DEFAULT SYSDATETIME()
);
