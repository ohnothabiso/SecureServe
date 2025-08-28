import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean, integer, pgEnum, jsonb, uuid, index } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const roleEnum = pgEnum("role", ["ADMIN", "CLERK", "AUDITOR"]);
export const loanStatusEnum = pgEnum("loan_status", ["TAKEN", "RETURNED", "OVERDUE"]);
export const auditActionEnum = pgEnum("audit_action", [
  "USER_LOGIN",
  "USER_CREATE", 
  "USER_UPDATE",
  "USER_DELETE",
  "ITEM_CREATE",
  "ITEM_UPDATE", 
  "ITEM_DELETE",
  "LOAN_CREATE",
  "LOAN_RETURN",
  "LOAN_OVERDUE",
  "STUDENT_CREATE",
  "STUDENT_UPDATE",
  "EXPORT",
  "SETTINGS_CHANGE"
]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("CLERK"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLoginAt: timestamp("last_login_at"),
  isActive: boolean("is_active").default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: timestamp("locked_until"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Students table
export const students = pgTable("students", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentNo: varchar("student_no", { length: 50 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  surname: varchar("surname", { length: 100 }).notNull(),
  roomNo: varchar("room_no", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  studentNoIdx: index("students_student_no_idx").on(table.studentNo),
  nameIdx: index("students_name_idx").on(table.name, table.surname),
}));

// Items table
export const items = pgTable("items", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  category: varchar("category", { length: 100 }).notNull(),
  specification: text("specification"),
  assetTag: varchar("asset_tag", { length: 50 }).unique(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  assetTagIdx: index("items_asset_tag_idx").on(table.assetTag),
  categoryIdx: index("items_category_idx").on(table.category),
  activeIdx: index("items_active_idx").on(table.isActive),
}));

// Loans table
export const loans = pgTable("loans", {
  id: uuid("id").primaryKey().defaultRandom(),
  studentId: uuid("student_id").references(() => students.id).notNull(),
  itemId: uuid("item_id").references(() => items.id).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  cardReceived: boolean("card_received").default(false).notNull(),
  takenAt: timestamp("taken_at").defaultNow().notNull(),
  returnedAt: timestamp("returned_at"),
  status: loanStatusEnum("status").default("TAKEN").notNull(),
  notes: text("notes"),
  createdByUserId: uuid("created_by_user_id").references(() => users.id).notNull(),
  closedByUserId: uuid("closed_by_user_id").references(() => users.id),
}, (table) => ({
  statusTakenAtIdx: index("loans_status_taken_at_idx").on(table.status, table.takenAt),
  studentIdx: index("loans_student_idx").on(table.studentId),
  itemIdx: index("loans_item_idx").on(table.itemId),
  activeLoansIdx: index("loans_active_idx").on(table.status).where(sql`${table.status} IN ('TAKEN', 'OVERDUE')`),
}));

// Audit Log table
export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  actorUserId: uuid("actor_user_id").references(() => users.id),
  action: auditActionEnum("action").notNull(),
  entity: varchar("entity", { length: 50 }).notNull(),
  entityId: uuid("entity_id"),
  ip: varchar("ip", { length: 45 }),
  userAgent: text("user_agent"),
  at: timestamp("at").defaultNow().notNull(),
  diff: jsonb("diff"),
}, (table) => ({
  actorIdx: index("audit_logs_actor_idx").on(table.actorUserId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  entityIdx: index("audit_logs_entity_idx").on(table.entity, table.entityId),
  timestampIdx: index("audit_logs_timestamp_idx").on(table.at),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdLoans: many(loans, { relationName: "createdLoans" }),
  closedLoans: many(loans, { relationName: "closedLoans" }),
  auditLogs: many(auditLogs),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  loans: many(loans),
}));

export const itemsRelations = relations(items, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one }) => ({
  student: one(students, {
    fields: [loans.studentId],
    references: [students.id],
  }),
  item: one(items, {
    fields: [loans.itemId],
    references: [items.id],
  }),
  createdBy: one(users, {
    fields: [loans.createdByUserId],
    references: [users.id],
    relationName: "createdLoans",
  }),
  closedBy: one(users, {
    fields: [loans.closedByUserId],
    references: [users.id],
    relationName: "closedLoans",
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  actor: one(users, {
    fields: [auditLogs.actorUserId],
    references: [users.id],
  }),
}));

// Zod schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLoginAt: true,
  failedLoginAttempts: true,
  lockedUntil: true,
}).extend({
  password: z.string().min(8).max(100),
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertItemSchema = createInsertSchema(items).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  takenAt: true,
  returnedAt: true,
  status: true,
  createdByUserId: true,
  closedByUserId: true,
});

export const insertAuditLogSchema = createInsertSchema(auditLogs).omit({
  id: true,
  at: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type Item = typeof items.$inferSelect;
export type InsertItem = z.infer<typeof insertItemSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = z.infer<typeof insertAuditLogSchema>;

// Login schema
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;
