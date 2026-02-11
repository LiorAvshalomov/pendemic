# PenDemic – Database Documentation

This folder contains a full export of the current Supabase/PostgreSQL database schema.

The goal of this documentation is:

- Preserve full DB structure before production deployment
- Allow AI tools (ChatGPT / Claude) to reason about the schema
- Enable safe refactors
- Provide audit visibility for RLS, RPC, indexes and moderation system

---

## 📂 Files Overview

### tables.csv

Full list of tables and columns including:

- schema
- table name
- column name
- data type
- nullable
- default values
- numeric precision
- char limits

Used to understand data model and relationships.

---

### views.csv

All SQL views including full SQL definition.

Used for:

- analytics
- dashboards
- derived data
- performance optimizations

---

### rpc.csv

All Postgres functions (RPCs), including:

- schema
- function name
- arguments
- return type
- security definer flag
- full SQL body

Critical for:

- start_conversation
- moderation logic
- analytics RPCs
- admin actions

---

### rls_status.csv

Shows:

- which tables have RLS enabled
- which tables force RLS

Important for security validation before production.

---

### rls_policies.csv

Full list of RLS policies including:

- table
- command (select/insert/update/delete)
- roles
- using clause
- with_check clause

Used to validate:

- user isolation
- moderation enforcement
- admin bypass rules

---

### foreign_keys.csv

All FK constraints including:

- update rule
- delete rule

Used to validate cascading deletes and moderation safety.

---

### indexes.csv

All indexes including full SQL definition.

Used for:

- performance review
- dashboard queries
- filtering & time-range analytics

---

### triggers.csv

All triggers and definitions.

Important for:

- auto timestamps
- moderation hooks
- cascade logic

---

### enums.csv

All ENUM types used in the system.

Example:

- moderation status
- post status
- notification types

---

# ⚙️ Current Moderation Model

The system supports:

## 1. Restricted (Suspended)

- Partial access
- Cannot write content
- Can contact system

## 2. Banned

- Full lock
- Redirected to /banned
- Only allowed to access /banned/contact

## 3. Admin Post Soft Delete (Moderated)

- Not user trash
- Only admin can restore
- Does not auto-delete after 14 days

## 4. Hard Delete

- Permanent removal
- Cascades cleaned manually

---

# 🔐 Security Principles

- All critical data protected by RLS
- Admin routes validated server-side via ADMIN_USER_IDS
- No client-side trust for moderation
- Cross-tab session invalidation implemented
- System user identity handled via NEXT_PUBLIC_SYSTEM_USER_ID

---

# 🚀 Production Checklist

Before going live:

- Verify RLS on all public tables
- Verify no table has unintended public SELECT
- Confirm moderation RPC behavior
- Confirm admin routes require server validation
- Confirm system user ID matches production value
- Review indexes for analytics queries

---

# 🧠 Notes for AI Refactoring

When refactoring:

- Never remove RLS
- Never bypass server-side admin validation
- Avoid converting server components unnecessarily
- Maintain mobile-first philosophy
- Avoid introducing `any` in TypeScript
