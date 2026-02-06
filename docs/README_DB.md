# Database Reference (Supabase)

This folder contains **read-only documentation snapshots** of the database schema.
These files exist to help understand the database structure without connecting to
Supabase directly.

⚠️ These files are **documentation only**.
Do NOT treat them as migrations or live sources of truth.

---

## 📌 General Rules

- The database is the **source of truth**.
- Client-side logic must NOT re-calculate business rules already handled by the DB.
- Do NOT change schema, views, RPCs, or RLS unless explicitly instructed.
- When modifying UI or API usage:
  - First verify required fields exist in views or RPC payloads.
  - Never assume fields that are not documented here.

---

## 📂 Files Overview

### `db/tables.csv`

List of all tables and columns.
Includes:

- schema
- table name
- column name
- data type
- nullability
- defaults

Use this to:

- verify column existence
- understand table structure

---

### `db/views.csv`

All database views and their SQL definitions.

Use this to:

- understand what data is already pre-aggregated
- avoid re-computing logic in the client
- confirm which fields are exposed to the app

---

### `db/rpc.csv`

All RPC (Postgres functions) used by the app.

Includes:

- function name
- arguments
- return types
- full function body

Use this to:

- understand server-side logic
- confirm what logic runs inside the DB
- avoid duplicating business rules in the client

---

### `db/rls_policies.csv`

Row Level Security (RLS) policies.

Use this to:

- understand who can read/write which rows
- avoid frontend logic that contradicts RLS
- debug permission-related issues

---

### `db/foreign_keys.csv`

Foreign key relationships between tables.

Use this to:

- understand table relations
- reason about joins and cascades
- avoid incorrect client-side assumptions

---

### `db/indexes.csv`

Indexes and uniqueness constraints.

Use this to:

- understand performance considerations
- see which columns are indexed or unique
- avoid inefficient query patterns

---

### `db/constraints.csv`

Primary keys, unique constraints, checks, and exclusions.

Use this to:

- understand data integrity rules
- avoid invalid inserts/updates
- reason about edge cases

---

## 🧠 How to Work With This Folder

Before changing code:

1. Identify the table/view/RPC involved.
2. Check the relevant CSV file(s).
3. Confirm the required fields already exist.
4. Only then modify application code.

If something is missing:

- Do NOT invent it in the client.
- Ask explicitly whether the DB should change.

---

## 🔒 Security Note

- Never commit Supabase keys here.
- Never connect tools or AI directly to production Supabase.
- These files are intentionally **static snapshots**.

---

## ✅ Goal

This folder exists to:

- prevent hidden assumptions
- keep DB logic centralized
- avoid client/DB drift
- make changes safe and predictable
