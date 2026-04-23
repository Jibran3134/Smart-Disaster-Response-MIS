CREATE DATABASE DisasterResponseDB

USE DisasterResponseDB

CREATE TABLE Role (
    role_id INT IDENTITY(1,1) PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL UNIQUE,
    CONSTRAINT chk_role_name CHECK (
        role_name IN ('Administrator','Emergency Operator','Field Officer',
                      'Warehouse Manager','Finance Officer')
    )
);

CREATE TABLE Users (
    user_id INT IDENTITY(1,1) PRIMARY KEY,
    role_id INT NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',
    phone_number VARCHAR(20),
    created_at DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_user_status CHECK (status IN ('Active','Inactive','Suspended')),
    CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES Role(role_id)
);

CREATE TABLE Hospital (
    hospital_id INT IDENTITY(1,1) PRIMARY KEY,
    hospital_name VARCHAR(100) NOT NULL,
    total_beds INT NOT NULL,
    available_beds INT NOT NULL,
    address VARCHAR(200) NOT NULL,
    city VARCHAR(200) NOT NULL,

    CONSTRAINT chk_beds CHECK (available_beds >= 0 AND available_beds <= total_beds)
);

CREATE TABLE Disaster_Event (
    event_id INT IDENTITY(1,1) PRIMARY KEY,
    event_name VARCHAR(100) NOT NULL,
    disaster_type VARCHAR(50) NOT NULL,
    affected_areas VARCHAR(MAX),
    start_date DATETIME NOT NULL,
    end_date DATETIME NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Active',

    CONSTRAINT chk_disaster_type CHECK (
        disaster_type IN ('Flood','Earthquake','Fire','Cyclone','Landslide','Other')
    ),
    CONSTRAINT chk_event_status CHECK (
        status IN ('Active','Contained','Resolved','Closed')
    ),
    CONSTRAINT chk_event_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

CREATE TABLE Emergency_Report (
    report_id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL,
    reported_by INT NOT NULL,
    area_name VARCHAR(100) NOT NULL,
    latitude DECIMAL(9,6) NOT NULL,
    longitude DECIMAL(9,6) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Open',
    report_time DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_severity CHECK (severity IN ('Low','Medium','High','Critical')),
    CONSTRAINT chk_report_status CHECK (status IN ('Open','In Progress','Resolved','Closed')),

    CONSTRAINT fk_report_event FOREIGN KEY (event_id) REFERENCES Disaster_Event(event_id),
    CONSTRAINT fk_report_user FOREIGN KEY (reported_by) REFERENCES "Users"(user_id)
);

CREATE TABLE Patient (
    patient_id INT IDENTITY(1,1) PRIMARY KEY,
    hospital_id INT NOT NULL,
    report_id INT NULL,
    patient_name VARCHAR(100) NOT NULL,
    dob DATE,
    condition VARCHAR(100),
    admission_time DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_patient_hospital FOREIGN KEY (hospital_id) REFERENCES Hospital(hospital_id),
    CONSTRAINT fk_patient_report FOREIGN KEY (report_id) REFERENCES Emergency_Report(report_id)
);

CREATE TABLE Rescue_Team (
    team_id INT IDENTITY(1,1) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50) NOT NULL,
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6),
    area_name VARCHAR(100),
    availability_status VARCHAR(20) NOT NULL DEFAULT 'Available',

    CONSTRAINT chk_team_type CHECK (
        team_type IN ('Medical','Fire','Rescue','Search','Logistics')
    ),
    CONSTRAINT chk_team_status CHECK (
        availability_status IN ('Available','Assigned','Busy','Completed')
    )
);
CREATE TABLE Team_Contact (
    contact_id INT IDENTITY(1,1) PRIMARY KEY,
    team_id INT NOT NULL,
    contact_number VARCHAR(20) NOT NULL,
    FOREIGN KEY (team_id) REFERENCES Rescue_Team(team_id)
        ON DELETE CASCADE
);

CREATE TABLE Approval_Request (
    request_id INT IDENTITY(1,1) PRIMARY KEY,
    requested_by INT NOT NULL,
    approved_by INT NULL,
    reference_id INT NULL,
    request_type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'Pending',
    remarks VARCHAR(MAX),
    request_time DATETIME DEFAULT GETDATE(),

    CONSTRAINT chk_approval_status CHECK (
        status IN ('Pending','Approved','Rejected','Cancelled')
    ),

    CONSTRAINT fk_req_user FOREIGN KEY (requested_by) REFERENCES "Users"(user_id),
    CONSTRAINT fk_app_user FOREIGN KEY (approved_by) REFERENCES "Users"(user_id)
);

CREATE TABLE Team_Assignment (
    team_id INT NOT NULL,
    report_id INT NOT NULL,
    assigned_at DATETIME DEFAULT GETDATE(),
    completed_at DATETIME NULL,

    PRIMARY KEY (team_id, report_id),

    CONSTRAINT fk_team FOREIGN KEY (team_id) REFERENCES Rescue_Team(team_id),
    CONSTRAINT fk_report FOREIGN KEY (report_id) REFERENCES Emergency_Report(report_id)
);

CREATE TABLE Warehouse (
    warehouse_id INT IDENTITY(1,1) PRIMARY KEY,
    managed_by INT NOT NULL,
    warehouse_name VARCHAR(100) NOT NULL,
    capacity INT NOT NULL,
    street VARCHAR(200),
    city VARCHAR(200) NOT NULL,

    CONSTRAINT fk_wh_user FOREIGN KEY (managed_by) REFERENCES "Users"(user_id)
);

CREATE TABLE Resource (
    resource_id INT IDENTITY(1,1) PRIMARY KEY,
    resource_name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,

    CONSTRAINT chk_resource_type CHECK (
        resource_type IN ('Food','Water','Medicine','Shelter','Equipment','Vehicle','Other')
    )
);

CREATE TABLE Inventory (
    warehouse_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity_available INT DEFAULT 0,
    threshold_level INT DEFAULT 10,

    PRIMARY KEY (warehouse_id, resource_id),

    CONSTRAINT fk_inv_wh FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id),
    CONSTRAINT fk_inv_res FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
);

CREATE TABLE Allocation (
    allocation_id INT IDENTITY(1,1) PRIMARY KEY,
    report_id INT NOT NULL,
    allocated_by INT NOT NULL,
    warehouse_id INT NULL,
    status VARCHAR(20) DEFAULT 'Pending',

    CONSTRAINT chk_alloc_status CHECK (
        status IN ('Pending','Approved','Dispatched','Delivered','Cancelled')
    ),

    CONSTRAINT fk_alloc_report FOREIGN KEY (report_id) REFERENCES Emergency_Report(report_id),
    CONSTRAINT fk_alloc_user FOREIGN KEY (allocated_by) REFERENCES "Users"(user_id),
    CONSTRAINT fk_alloc_wh FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id)
);

CREATE TABLE Resource_Allocation (
    allocation_id INT NOT NULL,
    resource_id INT NOT NULL,
    requested_qty INT NOT NULL,
    approved_qty INT NULL,

    PRIMARY KEY (allocation_id, resource_id),

    CONSTRAINT fk_ra_alloc FOREIGN KEY (allocation_id) REFERENCES Allocation(allocation_id),
    CONSTRAINT fk_ra_res FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
);

CREATE TABLE Donor (
    donor_id INT IDENTITY(1,1) PRIMARY KEY,
    donor_name VARCHAR(100) NOT NULL,
    donor_type VARCHAR(50),
    contact_info VARCHAR(100)
);

CREATE TABLE Financial_Transaction (
    transaction_id INT IDENTITY(1,1) PRIMARY KEY,

    made_by_user INT NULL,
    made_by_donor INT NULL,
    event_id INT  NULL,
    amount DECIMAL(12,2) NOT NULL,
    transaction_date DATETIME DEFAULT GETDATE(),
    transaction_type VARCHAR(20) NOT NULL,
    status VARCHAR(20) DEFAULT 'Pending',
    CONSTRAINT chk_ft_type CHECK (transaction_type IN ('Donation','Expense','Procurement','Transfer')),
    CONSTRAINT chk_ft_status CHECK (status IN ('Pending','Completed','Failed','Reversed')),
    CONSTRAINT chk_ft_actor CHECK ((made_by_user IS NOT NULL AND made_by_donor IS NULL) OR
        (made_by_user IS NULL AND made_by_donor IS NOT NULL)
    ),

    CONSTRAINT fk_ft_user FOREIGN KEY (made_by_user) REFERENCES "Users"(user_id),
    CONSTRAINT fk_ft_donor FOREIGN KEY (made_by_donor) REFERENCES Donor(donor_id),
    CONSTRAINT fk_ft_event FOREIGN KEY (event_id) REFERENCES Disaster_Event(event_id)
);
CREATE TABLE Procurement (
    procurement_id INT IDENTITY(1,1) PRIMARY KEY,
    procured_by INT NOT NULL,
    warehouse_id INT NOT NULL,
    transaction_id INT NULL,
    procurement_date DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_proc_user FOREIGN KEY (procured_by) REFERENCES "Users"(user_id),
    CONSTRAINT fk_proc_wh FOREIGN KEY (warehouse_id) REFERENCES Warehouse(warehouse_id),
    CONSTRAINT fk_proc_ft FOREIGN KEY (transaction_id) REFERENCES Financial_Transaction(transaction_id)
);

CREATE TABLE Procurement_Items (
    procurement_id INT NOT NULL,
    resource_id INT NOT NULL,
    quantity INT NOT NULL,

    PRIMARY KEY (procurement_id, resource_id),

    CONSTRAINT fk_pi_proc FOREIGN KEY (procurement_id) REFERENCES Procurement(procurement_id),
    CONSTRAINT fk_pi_res FOREIGN KEY (resource_id) REFERENCES Resource(resource_id)
);

CREATE TABLE Budget (
    budget_id INT IDENTITY(1,1) PRIMARY KEY,
    event_id INT NOT NULL,
    total_allocated DECIMAL(12,2) NOT NULL,
    total_spent DECIMAL(12,2) NOT NULL DEFAULT 0,
    remaining_balance AS (total_allocated - total_spent),

    CONSTRAINT fk_budget_event FOREIGN KEY (event_id) REFERENCES Disaster_Event(event_id)
);

CREATE TABLE Financial_Transaction_Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    transaction_id INT NOT NULL,
    action_type VARCHAR(20) NOT NULL,
    performed_by INT NOT NULL,
    log_time DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_ftl_trans FOREIGN KEY (transaction_id) REFERENCES Financial_Transaction(transaction_id),
    CONSTRAINT fk_ftl_user FOREIGN KEY (performed_by) REFERENCES "Users"(user_id)
);

CREATE TABLE Audit_Log (
    log_id INT IDENTITY(1,1) PRIMARY KEY,
    user_id INT NOT NULL,
    record_id INT NULL,
    action_type VARCHAR(50),
    table_name VARCHAR(50),
    old_value VARCHAR(MAX),
    new_value VARCHAR(MAX),
    log_time DATETIME DEFAULT GETDATE(),

    CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES "Users"(user_id)
);
