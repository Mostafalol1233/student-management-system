---
name: Expenses and AuditLogs schema
description: New tables added for expense tracking and audit trail, with storage/route patterns
---

## Tables added to shared/schema.ts
- `expenses`: id, category (rent|electricity|salaries|printing|maintenance|other), amount (real), date (text), description (text|null), createdAt
- `auditLogs`: id, entity, entityId, action, actor, details, createdAt — table exists but no UI/routes yet

## Insert schemas
- `insertExpenseSchema` = createInsertSchema(expenses).omit({ id, createdAt })
- `insertAuditLogSchema` = createInsertSchema(auditLogs).omit({ id, createdAt })

## Storage (MemStorage)
- `expensesMap = new Map<string, Expense>()` in MemStorage
- Methods: getAllExpenses (sorted desc by date), getExpense, createExpense, updateExpense, deleteExpense

## Routes
- GET/POST/PUT/DELETE /api/expenses
- GET /api/teachers/:id/salary-report — returns { teacher, studentCount, teacherRevenue, expectedSalary, paid:0, remaining }

**Why real:** crypto.randomUUID() used (not gen_random_uuid which is PG-only) since still using MemStorage.
