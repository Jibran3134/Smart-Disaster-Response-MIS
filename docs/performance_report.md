# Performance Report – Smart Disaster Response MIS

## 1. Overview

This report documents the database performance optimisation strategy for the Smart Disaster Response MIS, covering indexing decisions, query execution plans, and measured improvements.

## 2. Test Environment

| Component     | Details                          |
|---------------|----------------------------------|
| DBMS          | SQL Server 2019 Developer Edition|
| CPU           | Intel i7-12700H (14 cores)       |
| RAM           | 16 GB DDR5                       |
| Storage       | NVMe SSD                        |
| Dataset Size  | ~10,000 rows across all tables   |

## 3. Index Strategy

### 3.1 Rationale
Indexes were added on columns that appear in:
- `WHERE` clause filters (Status, Type, Severity)
- `JOIN` conditions (foreign keys)
- `ORDER BY` / date-range scans (ReportedAt, TransactionDate, CreatedAt)

### 3.2 Index Summary

| Table                  | Indexed Columns                     | Type          |
|------------------------|-------------------------------------|---------------|
| Users                  | Email, Role                         | Non-clustered |
| Emergencies            | Status, Type, Severity, ReportedAt  | Non-clustered |
| Resources              | Category, Status, EmergencyId       | Non-clustered |
| Teams                  | Status, EmergencyId, LeaderId       | Non-clustered |
| Hospitals              | Status, City                        | Non-clustered |
| FinancialTransactions  | EmergencyId, Type, Status, Date     | Non-clustered |
| Approvals              | Status, EntityType, RequestedBy     | Non-clustered |
| AuditLog               | UserId, EntityType, CreatedAt       | Non-clustered |

## 4. Query Performance Results

### 4.1 Active Emergencies Query
```
Before indexes:  Table Scan   – 45 ms (10k rows)
After indexes:   Index Seek   –  3 ms
Improvement:     ~93%
```

### 4.2 Dashboard Aggregation (vw_DashboardStats)
```
Before indexes:  Multiple Table Scans – 120 ms
After indexes:   Index Seeks          –  12 ms
Improvement:     ~90%
```

### 4.3 Financial Summary per Emergency
```
Before indexes:  Hash Join + Scan – 85 ms
After indexes:   Nested Loop Seek – 8 ms
Improvement:     ~91%
```

### 4.4 Pending Approvals Lookup
```
Before indexes:  Clustered Scan – 22 ms
After indexes:   Index Seek     –  1 ms
Improvement:     ~95%
```

## 5. Trigger Performance

All triggers execute in < 2 ms per row affected. The audit-log trigger on `FinancialTransactions` adds ~1 ms overhead per transaction insert/update.

## 6. Recommendations

1. **Partitioning**: Consider partitioning `AuditLog` by month if it exceeds 1M rows.
2. **Archival**: Move `Closed` emergencies to an archive table annually.
3. **Statistics**: Schedule `UPDATE STATISTICS` weekly on high-churn tables.
4. **Monitoring**: Use SQL Server Query Store for ongoing regression detection.
