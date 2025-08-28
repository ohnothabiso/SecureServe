import { sql, relations } from "drizzle-orm";
import { sqliteTable, text, integer, blob, index, primaryKey } from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default("CLERK"), // ADMIN, CLERK, AUDITOR
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  lastLoginAt: text("last_login_at"),
  isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
  failedLoginAttempts: integer("failed_login_attempts").default(0).notNull(),
  lockedUntil: text("locked_until"),
}, (table) => ({
  emailIdx: index("users_email_idx").on(table.email),
}));

// Students table
export const students = sqliteTable("students", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  studentNo: text("student_no").notNull().unique(),
  name: text("name").notNull(),
  surname: text("surname").notNull(),
  roomNo: text("room_no"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  studentNoIdx: index("students_student_no_idx").on(table.studentNo),
}));

// Items table
export const items = sqliteTable("items", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  name: text("name").notNull(),
  category: text("category"),
  specification: text("specification"),
  assetTag: text("asset_tag").unique(),
  isActive: integer("is_active", { mode: 'boolean' }).default(true).notNull(),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  assetTagIdx: index("items_asset_tag_idx").on(table.assetTag),
  nameIdx: index("items_name_idx").on(table.name),
}));

// Loans table
export const loans = sqliteTable("loans", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  studentId: text("student_id").notNull().references(() => students.id, { onDelete: "cascade" }),
  itemId: text("item_id").notNull().references(() => items.id, { onDelete: "cascade" }),
  destination: text("destination").notNull(),
  takenAt: text("taken_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
  expectedReturnAt: text("expected_return_at"),
  returnedAt: text("returned_at"),
  status: text("status").notNull().default("TAKEN"), // TAKEN, RETURNED, OVERDUE
  takenBy: text("taken_by").notNull().references(() => users.id),
  returnedBy: text("returned_by").references(() => users.id),
  notes: text("notes"),
}, (table) => ({
  studentIdIdx: index("loans_student_id_idx").on(table.studentId),
  itemIdIdx: index("loans_item_id_idx").on(table.itemId),
  statusIdx: index("loans_status_idx").on(table.status),
  takenAtIdx: index("loans_taken_at_idx").on(table.takenAt),
}));

// Audit logs table
export const auditLogs = sqliteTable("audit_logs", {
  id: text("id").primaryKey().$default(() => crypto.randomUUID()),
  userId: text("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // USER_LOGIN, USER_CREATE, etc.
  resourceType: text("resource_type"), // USER, ITEM, LOAN, STUDENT
  resourceId: text("resource_id"),
  details: text("details"), // JSON string
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`).notNull(),
}, (table) => ({
  userIdIdx: index("audit_logs_user_id_idx").on(table.userId),
  actionIdx: index("audit_logs_action_idx").on(table.action),
  createdAtIdx: index("audit_logs_created_at_idx").on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  loans: many(loans),
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
  takenByUser: one(users, {
    fields: [loans.takenBy],
    references: [users.id],
  }),
  returnedByUser: one(users, {
    fields: [loans.returnedBy],
    references: [users.id],
  }),
}));

export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users, {
  email: z.string().email(),
  role: z.enum(["ADMIN", "CLERK", "AUDITOR"]),
});

export const selectUserSchema = createSelectSchema(users);

export const insertStudentSchema = createInsertSchema(students, {
  studentNo: z.string().min(1),
  name: z.string().min(1),
  surname: z.string().min(1),
});

export const selectStudentSchema = createSelectSchema(students);

export const insertItemSchema = createInsertSchema(items, {
  name: z.string().min(1),
});

export const selectItemSchema = createSelectSchema(items);

export const insertLoanSchema = createInsertSchema(loans, {
  destination: z.string().min(1),
  status: z.enum(["TAKEN", "RETURNED", "OVERDUE"]),
});

export const selectLoanSchema = createSelectSchema(loans);

export const insertAuditLogSchema = createInsertSchema(auditLogs);
export const selectAuditLogSchema = createSelectSchema(auditLogs);

// API schemas
export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export type LoginRequest = z.infer<typeof loginSchema>;

export const createLoanSchema = z.object({
  studentId: z.string(),
  itemId: z.string(),
  destination: z.string().min(1),
  expectedReturnAt: z.string().optional(),
  notes: z.string().optional(),
});

export type CreateLoanRequest = z.infer<typeof createLoanSchema>;

export const createStudentSchema = z.object({
  studentNo: z.string().min(1),
  name: z.string().min(1),
  surname: z.string().min(1),
  roomNo: z.string().optional(),
});

export type CreateStudentRequest = z.infer<typeof createStudentSchema>;

export const createItemSchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
  specification: z.string().optional(),
  assetTag: z.string().optional(),
});

export type CreateItemRequest = z.infer<typeof createItemSchema>;

export const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["ADMIN", "CLERK", "AUDITOR"]),
});

export type CreateUserRequest = z.infer<typeof createUserSchema>;