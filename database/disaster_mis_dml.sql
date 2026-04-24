USE DisasterResponseDB;


INSERT INTO Role (role_name) VALUES
('Administrator'),
('Emergency Operator'),
('Field Officer'),
('Warehouse Manager'),
('Finance Officer');

INSERT INTO Users (role_id, full_name, email, password_hash, status, phone_number) VALUES
(1, 'Jibran',  'i243134@isb.nu.edu.pk', '$2b$12$KIX8...adminHash', 'Active', '0345-1234567'),
(2, 'Alishba', 'i243176@isb.nu.edu.pk', '$2b$12$KIX8...adminHash', 'Active', '0345-1234567'),
(3, 'Ashar',   'i243072@isb.nu.edu.pk', '$2b$12$KIX8...adminHash', 'Active', '0345-1234567');

INSERT INTO Hospital (hospital_name, total_beds, available_beds, address, city) VALUES
('Jinnah Hospital', 500, 120, 'Shad Bagh Road', 'Lahore'),
('PIMS Hospital', 600, 200, 'G-8/3', 'Islamabad'),
('Civil Hospital Karachi', 800, 300, 'Karachi Cantt', 'Karachi');

INSERT INTO Disaster_Event (event_name, disaster_type, affected_areas, start_date, end_date, status) VALUES
('Punjab Flood', 'Flood', 'DG Khan, Muzaffargarh', '2024-07-15', NULL, 'Active'),
('KPK Earthquake', 'Earthquake', 'Swat, Dir', '2024-10-05', '2024-10-05', 'Resolved'),
('Karachi Fire', 'Fire', 'SITE Area', '2024-11-20', '2024-11-21', 'Resolved');

INSERT INTO Emergency_Report (event_id, reported_by, area_name, latitude, longitude, severity, status, report_time) VALUES
(1, 2, 'DG Khan City', 29.96, 70.63, 'Critical', 'In Progress', '2024-07-15'),
(1, 3, 'Muzaffargarh', 30.07, 71.18, 'High', 'Open', '2024-07-15'),
(2, 2, 'Swat', 34.77, 72.36, 'Critical', 'Resolved', '2024-10-05'),
(2, 3, 'Dir', 35.26, 71.84, 'Medium', 'Resolved', '2024-10-05'),
(3, 2, 'SITE Area', 24.89, 67.01, 'High', 'Closed', '2024-11-20');

INSERT INTO Patient (hospital_id, report_id, patient_name, dob, condition, admission_time) VALUES
(1, 1, 'Ali Khan', '1980-05-10', 'Drowning', '2024-07-15'),
(1, 2, 'Sara Bibi', '1995-03-20', 'Injury', '2024-07-15'),
(2, 3, 'Usman Ali', '1975-08-12', 'Fracture', '2024-10-05'),
(3, 5, 'Ahmed Raza', '1990-11-01', 'Burns', '2024-11-20');

INSERT INTO Rescue_Team (team_name, team_type, latitude, longitude, area_name, availability_status) VALUES
('Alpha Medical', 'Medical', 31.52, 74.35,  'Lahore', 'Available'),
('Bravo Fire', 'Fire', 33.72, 73.04,  'Islamabad', 'Available'),
('Charlie Search', 'Search', 24.86, 67.00, 'Karachi', 'Assigned'),
('Delta Rescue', 'Rescue', 34.01, 71.52,  'Peshawar', 'Available'),
('Echo Logistics', 'Logistics', 30.15, 71.52, 'Multan', 'Available');

INSERT INTO Team_Contact (team_id, contact_number)
VALUES 
(1, '03001234567'),
(1, '03111234567');

INSERT INTO Warehouse (managed_by, warehouse_name, capacity, street, city) VALUES
(1, 'Lahore Depot', 5000, 'Ferozepur Road', 'Lahore'),
(1, 'Islamabad Store', 4000, 'H-9', 'Islamabad'),
(2, 'Karachi Warehouse', 8000, 'West Wharf', 'Karachi'),
(3, 'Quetta Store', 2500, 'Brewery Road', 'Quetta');

INSERT INTO Resource (resource_name, resource_type, unit_cost) VALUES
('Food Pack', 'Food', 500),
('Water Bottle', 'Water', 100),
('First Aid Kit', 'Medicine', 2000),
('Tent', 'Shelter', 15000),
('Fire Extinguisher', 'Equipment', 3000),
('Ambulance', 'Vehicle', 40000);

INSERT INTO Inventory (warehouse_id, resource_id, quantity_available, threshold_level) VALUES
(1, 1, 200, 50),
(1, 2, 150, 30),
(2, 3, 80, 20),
(2, 4, 40, 10),
(3, 5, 60, 15),
(4, 1, 100, 25);

INSERT INTO Allocation (report_id, allocated_by, warehouse_id, status) VALUES
(1, 1, 1, 'Dispatched'),
(2, 1, 1, 'Pending'),
(3, 2, 2, 'Delivered'),
(5, 2, 3, 'Delivered');

INSERT INTO Resource_Allocation (allocation_id, resource_id, requested_qty, approved_qty) VALUES
(1, 1, 100, 100),
(1, 2, 50, 50),
(2, 1, 80, NULL),
(3, 3, 30, 30),
(4, 5, 20, 20);

INSERT INTO Donor (donor_name, donor_type, contact_info) VALUES
('Edhi Foundation', 'NGO', '021-32211009'),
('USAID', 'International', 'usaid.pk@usaid.gov');

INSERT INTO Financial_Transaction (made_by_user, made_by_donor, amount, transaction_date, transaction_type, status) VALUES
(1, NULL, 2000000, '2024-07-16', 'Expense', 'Completed'),
(NULL, 1, 5000000, '2024-07-17', 'Donation', 'Completed');

INSERT INTO Budget (event_id, total_allocated, total_spent) VALUES
(1, 20000000, 5000000),
(2, 15000000, 7000000),
(3, 10000000, 4000000);