# Design Rationale – Smart Disaster Response MIS

## 1. Project Purpose

A Management Information System (MIS) for coordinating disaster response operations, tracking resources, managing response teams, and monitoring hospital capacity in real-time.

## 2. Architecture Decisions

### 2.1 Three-Tier Architecture
| Tier       | Technology            | Justification                              |
|------------|-----------------------|--------------------------------------------|
| Database   | SQL Server 2019       | ACID compliance, robust triggers & views   |
| Backend    | ASP.NET Core 8 API    | High-performance, cross-platform C# API    |
| Frontend   | React 18 + Tailwind   | Component-based UI with rapid styling      |

### 2.2 Why SQL Server?
- Native support for `CHECK` constraints enforcing domain rules at the DB level.
- `IDENTITY` columns for surrogate keys ensure uniqueness without app logic.
- `DATETIME2` with `SYSDATETIME()` provides high-precision audit timestamps.
- Rich trigger support enables automated workflows (audit logs, calculated fields).

### 2.3 Why ASP.NET Core Minimal API?
- Lightweight, no MVC overhead for a pure REST API.
- Built-in DI container for `SqlConnection` factory pattern.
- Custom middleware pipeline for authentication and RBAC.

## 3. Database Design Rationale

### 3.1 Normalisation
All tables are in **3NF** (Third Normal Form):
- No repeating groups (1NF).
- No partial dependencies (2NF) – every non-key column depends on the whole PK.
- No transitive dependencies (3NF) – no non-key column depends on another non-key.

### 3.2 Entity Choices
| Entity                | Why it exists                                        |
|-----------------------|------------------------------------------------------|
| Users                 | Central identity; supports RBAC via Role column      |
| Emergencies           | Core domain entity; tracks lifecycle of each event   |
| Resources             | Inventory management with deployment tracking        |
| Teams                 | Response unit coordination with leader assignment    |
| TeamMembers           | Junction table enabling many-to-many (Teams ↔ Users) |
| Hospitals             | Capacity monitoring for medical routing decisions    |
| FinancialTransactions | Fiscal accountability and budget tracking            |
| Approvals             | Workflow gate for sensitive operations               |
| AuditLog              | Non-repudiation and compliance trail                 |

### 3.3 Constraints & Triggers
- `CHECK` constraints enforce valid enum values at the DB level, preventing bad data regardless of which client writes.
- Triggers automate `UpdatedAt` timestamps, `MemberCount` recalculations, and audit-log entries, reducing application-layer complexity.

## 4. Security Model

### 4.1 Role-Based Access Control (RBAC)
| Role        | Capabilities                                      |
|-------------|---------------------------------------------------|
| Admin       | Full CRUD on all entities; user management         |
| Coordinator | Create/assign emergencies; deploy teams            |
| Responder   | Update emergency status; view resources            |
| Medical     | Update hospital data; view emergencies             |
| Finance     | Manage transactions; request approvals             |

### 4.2 Authentication Flow
1. User submits credentials to `/api/auth/login`.
2. Backend verifies password hash and returns a JWT.
3. Subsequent requests include `Authorization: Bearer <token>`.
4. `AuthMiddleware` validates the JWT on every request.
5. `RbacMiddleware` checks the user's role against endpoint requirements.

## 5. Frontend Design

- **Single Page Application** with React Router for client-side navigation.
- **AuthContext** provides global authentication state.
- **ProtectedRoute** component enforces login before accessing pages.
- **Axios** instance pre-configured with base URL and auth headers.
