-- ============================================================
-- Smart Disaster Response MIS – Seed / Sample Data
-- Run AFTER schema.sql
-- ============================================================

SET IDENTITY_INSERT Users ON;
INSERT INTO Users (UserId, FullName, Email, PasswordHash, Role, Phone)
VALUES
(1, 'Admin User',        'admin@disaster.gov',       'AQAAAAIAAYagAAAAEH...hashed...', 'Admin',       '+1-555-0100'),
(2, 'Sarah Coordinator', 'sarah@disaster.gov',        'AQAAAAIAAYagAAAAEH...hashed...', 'Coordinator', '+1-555-0101'),
(3, 'James Responder',   'james@disaster.gov',        'AQAAAAIAAYagAAAAEH...hashed...', 'Responder',   '+1-555-0102'),
(4, 'Dr. Emily Clark',   'emily.clark@disaster.gov',  'AQAAAAIAAYagAAAAEH...hashed...', 'Medical',     '+1-555-0103'),
(5, 'Robert Finance',    'robert.fin@disaster.gov',   'AQAAAAIAAYagAAAAEH...hashed...', 'Finance',     '+1-555-0104'),
(6, 'Lisa Responder',    'lisa@disaster.gov',          'AQAAAAIAAYagAAAAEH...hashed...', 'Responder',   '+1-555-0105'),
(7, 'Ahmed Khan',        'ahmed.khan@disaster.gov',   'AQAAAAIAAYagAAAAEH...hashed...', 'Coordinator', '+1-555-0106'),
(8, 'Maria Garcia',      'maria.g@disaster.gov',      'AQAAAAIAAYagAAAAEH...hashed...', 'Medical',     '+1-555-0107');
SET IDENTITY_INSERT Users OFF;

-- Emergencies
SET IDENTITY_INSERT Emergencies ON;
INSERT INTO Emergencies (EmergencyId, Title, Description, Type, Severity, Status, Latitude, Longitude, Location, ReportedBy, AssignedTo)
VALUES
(1, '7.2 Earthquake – Westside District', 'Major earthquake with building collapses; estimated 200+ affected.', 'Earthquake', 'Critical', 'InProgress', 34.052235, -118.243683, 'Westside District, Los Angeles, CA', 2, 3),
(2, 'Riverside Flooding',                 'Flash flood along Green River; roads impassable.',                   'Flood',      'High',     'Acknowledged', 35.960638, -83.920739, 'Riverside County, TN', 7, 6),
(3, 'Industrial Plant Fire',              'Chemical fire at Eastport refinery; toxic plume risk.',              'Fire',       'Critical', 'InProgress', 29.749907, -95.358421, 'Eastport Industrial Zone, Houston, TX', 2, 3),
(4, 'Seasonal Flu Outbreak',              'Elevated flu hospitalisations in Metro General area.',               'Pandemic',   'Medium',   'Reported', 40.712776, -74.005974, 'Metro General District, New York, NY', 4, NULL),
(5, 'Warehouse Collapse',                 'Partial collapse of storage warehouse after heavy snow.',            'Other',      'High',     'Reported', 41.878113, -87.629799, 'North Industrial Park, Chicago, IL', 7, NULL);
SET IDENTITY_INSERT Emergencies OFF;

-- Resources
SET IDENTITY_INSERT Resources ON;
INSERT INTO Resources (ResourceId, Name, Category, Quantity, Unit, Status, Location, EmergencyId)
VALUES
(1,  'First-Aid Kits',        'Medical',        500,  'Kits',     'Deployed',   'Warehouse A', 1),
(2,  'Bottled Water (1L)',     'Food',          2000,  'Bottles',  'Deployed',   'Warehouse A', 1),
(3,  'Emergency Tents',       'Shelter',         80,  'Units',    'Deployed',   'Field Base 1', 1),
(4,  'Rescue Boats',          'Vehicle',         12,  'Units',    'Deployed',   'Marina Dock',  2),
(5,  'Hazmat Suits',          'Equipment',       60,  'Units',    'Deployed',   'Station 7',    3),
(6,  'Portable Radios',       'Communication',  150,  'Units',    'Available',  'HQ Storage',   NULL),
(7,  'Blankets',              'Shelter',        400,  'Units',    'Available',  'Warehouse B',  NULL),
(8,  'Diesel Generators',     'Equipment',       10,  'Units',    'Maintenance','Depot C',      NULL),
(9,  'IV Fluid Bags',         'Medical',        300,  'Bags',     'Available',  'Hospital Stores', NULL),
(10, 'MRE Ration Packs',      'Food',          5000,  'Packs',    'Available',  'Warehouse A',  NULL);
SET IDENTITY_INSERT Resources OFF;

-- Teams
SET IDENTITY_INSERT Teams ON;
INSERT INTO Teams (TeamId, TeamName, Specialization, Status, LeaderId, MemberCount, EmergencyId, DeployedAt)
VALUES
(1, 'Alpha SAR Unit',       'Search & Rescue', 'Deployed',   3, 8,  1, '2026-04-20T09:00:00'),
(2, 'Bravo Medical Squad',  'Medical',         'Deployed',   4, 6,  1, '2026-04-20T09:30:00'),
(3, 'Charlie Logistics',    'Logistics',       'Deployed',   6, 5,  2, '2026-04-21T07:00:00'),
(4, 'Delta Hazmat',         'Hazmat',          'Deployed',   3, 7,  3, '2026-04-21T11:00:00'),
(5, 'Echo Comms',           'Communications',  'Available',  7, 4,  NULL, NULL),
(6, 'Foxtrot General',      'General',         'Standby',    NULL, 10, NULL, NULL);
SET IDENTITY_INSERT Teams OFF;

-- Team Members (sample)
INSERT INTO TeamMembers (TeamId, UserId) VALUES
(1, 3), (1, 6),
(2, 4), (2, 8),
(3, 6), (3, 7),
(4, 3), (5, 7);

-- Hospitals
SET IDENTITY_INSERT Hospitals ON;
INSERT INTO Hospitals (HospitalId, Name, Address, City, Latitude, Longitude, TotalBeds, AvailableBeds, Phone, Status)
VALUES
(1, 'Metro General Hospital',    '100 Main St',     'New York',     40.712776, -74.005974,  500, 120, '+1-555-1001', 'Operational'),
(2, 'St. Mary''s Medical Center','250 Oak Ave',     'Los Angeles',  34.052235, -118.243683, 350,  30, '+1-555-1002', 'Limited'),
(3, 'Riverside Community Hosp.', '88 River Rd',     'Knoxville',    35.960638, -83.920739,  200,  85, '+1-555-1003', 'Operational'),
(4, 'Eastport Trauma Center',    '12 Industrial Blvd','Houston',    29.749907, -95.358421,  150,   5, '+1-555-1004', 'Full'),
(5, 'Lakeside General',          '400 Lake Dr',     'Chicago',      41.878113, -87.629799,  280, 190, '+1-555-1005', 'Operational');
SET IDENTITY_INSERT Hospitals OFF;

-- Financial Transactions
SET IDENTITY_INSERT FinancialTransactions ON;
INSERT INTO FinancialTransactions (TransactionId, EmergencyId, Type, Amount, Currency, Description, ApprovedBy, Status)
VALUES
(1, 1, 'Allocation',    500000.00, 'USD', 'Emergency fund release for earthquake response',      1, 'Approved'),
(2, 1, 'Expenditure',    75000.00, 'USD', 'Medical supplies procurement',                        1, 'Completed'),
(3, 2, 'Allocation',    200000.00, 'USD', 'Flood relief allocation',                             1, 'Approved'),
(4, 3, 'Allocation',    350000.00, 'USD', 'Hazmat response budget',                              1, 'Pending'),
(5, 1, 'Donation',      100000.00, 'USD', 'Corporate donation – TechCorp',                       NULL, 'Completed'),
(6, 2, 'Expenditure',    45000.00, 'USD', 'Rescue boat fuel and maintenance',                    5, 'Approved'),
(7, NULL, 'Allocation', 1000000.00,'USD', 'Annual disaster preparedness reserve',                 1, 'Approved');
SET IDENTITY_INSERT FinancialTransactions OFF;

-- Approvals
SET IDENTITY_INSERT Approvals ON;
INSERT INTO Approvals (ApprovalId, EntityType, EntityId, RequestedBy, ReviewedBy, Status, Comments, ReviewedAt)
VALUES
(1, 'Financial', 1, 5, 1, 'Approved',  'Urgent – release immediately.',         '2026-04-20T08:30:00'),
(2, 'Financial', 4, 5, NULL, 'Pending', 'Awaiting director sign-off.',           NULL),
(3, 'Resource',  5, 2, 1, 'Approved',   'Hazmat suits approved for deployment.', '2026-04-21T10:00:00'),
(4, 'Team',      4, 7, 1, 'Approved',   'Delta team cleared for chemical site.', '2026-04-21T10:45:00'),
(5, 'Emergency', 5, 7, NULL, 'Pending',  'Needs severity reassessment.',         NULL);
SET IDENTITY_INSERT Approvals OFF;
