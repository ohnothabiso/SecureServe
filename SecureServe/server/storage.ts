import { 
  users, students, items, loans, auditLogs,
  type User, type InsertUser, type Student, type InsertStudent, 
  type Item, type InsertItem, type Loan, type InsertLoan,
  type AuditLog, type InsertAuditLog
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, count, sql, like, or, gte, lte, isNull } from "drizzle-orm";
import bcrypt from "bcrypt";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser & { password: string }): Promise<User>;
  updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  
  // Students
  getStudent(id: string): Promise<Student | undefined>;
  getStudentByStudentNo(studentNo: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: string, updates: Partial<Omit<Student, 'id'>>): Promise<Student>;
  searchStudents(query: string): Promise<Student[]>;
  getAllStudents(): Promise<Student[]>;
  
  // Items
  getItem(id: string): Promise<Item | undefined>;
  getItemByAssetTag(assetTag: string): Promise<Item | undefined>;
  createItem(item: InsertItem): Promise<Item>;
  updateItem(id: string, updates: Partial<Omit<Item, 'id'>>): Promise<Item>;
  getAvailableItems(): Promise<Item[]>;
  getAllItems(): Promise<Item[]>;
  searchItems(query?: string, category?: string, isActive?: boolean): Promise<Item[]>;
  
  // Loans
  getLoan(id: string): Promise<Loan & { student: Student; item: Item; createdBy: User } | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  returnLoan(loanId: string, returnedByUserId: string): Promise<Loan>;
  getActiveLoans(): Promise<(Loan & { student: Student; item: Item })[]>;
  getOverdueLoans(): Promise<(Loan & { student: Student; item: Item })[]>;
  getAllLoans(filters?: {
    status?: string;
    studentId?: string;
    itemId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<(Loan & { student: Student; item: Item; createdBy: User })[]>;
  markLoansOverdue(maxLoanHours: number): Promise<number>;
  
  // Audit Logs
  createAuditLog(log: InsertAuditLog): Promise<AuditLog>;
  getAuditLogs(filters?: {
    actorUserId?: string;
    action?: string;
    entity?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<(AuditLog & { actor?: User })[]>;
  
  // Stats
  getStats(): Promise<{
    itemsOut: number;
    overdue: number;
    returnsToday: number;
    available: number;
    totalStudents: number;
    totalItems: number;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email.toLowerCase()));
    return user || undefined;
  }

  async createUser(userData: InsertUser & { password: string }): Promise<User> {
    const { password, ...userWithoutPassword } = userData;
    const passwordHash = await bcrypt.hash(password, 12);
    
    const [user] = await db
      .insert(users)
      .values({
        ...userWithoutPassword,
        email: userWithoutPassword.email.toLowerCase(),
        passwordHash,
      })
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<Omit<User, 'id'>>): Promise<User> {
    const [user] = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.createdAt));
  }

  // Students
  async getStudent(id: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student || undefined;
  }

  async getStudentByStudentNo(studentNo: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.studentNo, studentNo));
    return student || undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const [created] = await db.insert(students).values(student).returning();
    return created;
  }

  async updateStudent(id: string, updates: Partial<Omit<Student, 'id'>>): Promise<Student> {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async searchStudents(query: string): Promise<Student[]> {
    const searchTerm = `%${query}%`;
    return await db
      .select()
      .from(students)
      .where(
        or(
          like(students.studentNo, searchTerm),
          like(students.name, searchTerm),
          like(students.surname, searchTerm),
          like(students.roomNo, searchTerm)
        )
      )
      .orderBy(students.name, students.surname);
  }

  async getAllStudents(): Promise<Student[]> {
    return await db.select().from(students).orderBy(students.name, students.surname);
  }

  // Items
  async getItem(id: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.id, id));
    return item || undefined;
  }

  async getItemByAssetTag(assetTag: string): Promise<Item | undefined> {
    const [item] = await db.select().from(items).where(eq(items.assetTag, assetTag));
    return item || undefined;
  }

  async createItem(item: InsertItem): Promise<Item> {
    const [created] = await db.insert(items).values(item).returning();
    return created;
  }

  async updateItem(id: string, updates: Partial<Omit<Item, 'id'>>): Promise<Item> {
    const [item] = await db
      .update(items)
      .set(updates)
      .where(eq(items.id, id))
      .returning();
    return item;
  }

  async getAvailableItems(): Promise<Item[]> {
    const activeLoansSubquery = db
      .select({ itemId: loans.itemId })
      .from(loans)
      .where(or(eq(loans.status, 'TAKEN'), eq(loans.status, 'OVERDUE')));

    return await db
      .select()
      .from(items)
      .where(
        and(
          eq(items.isActive, true),
          sql`${items.id} NOT IN ${activeLoansSubquery}`
        )
      )
      .orderBy(items.category, items.name);
  }

  async getAllItems(): Promise<Item[]> {
    return await db.select().from(items).orderBy(items.category, items.name);
  }

  async searchItems(query?: string, category?: string, isActive?: boolean): Promise<Item[]> {
    const conditions = [];
    
    if (query) {
      const searchTerm = `%${query}%`;
      conditions.push(
        or(
          like(items.name, searchTerm),
          like(items.specification, searchTerm),
          like(items.assetTag, searchTerm)
        )
      );
    }
    
    if (category) {
      conditions.push(eq(items.category, category));
    }
    
    if (isActive !== undefined) {
      conditions.push(eq(items.isActive, isActive));
    }

    return await db
      .select()
      .from(items)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(items.category, items.name);
  }

  // Loans
  async getLoan(id: string): Promise<Loan & { student: Student; item: Item; createdBy: User } | undefined> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(students, eq(loans.studentId, students.id))
      .innerJoin(items, eq(loans.itemId, items.id))
      .innerJoin(users, eq(loans.createdByUserId, users.id))
      .where(eq(loans.id, id));

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.loans,
      student: row.students,
      item: row.items,
      createdBy: row.users,
    };
  }

  async createLoan(loan: InsertLoan & { createdByUserId: string }): Promise<Loan> {
    const [created] = await db.insert(loans).values(loan).returning();
    return created;
  }

  async returnLoan(loanId: string, returnedByUserId: string): Promise<Loan> {
    const [returned] = await db
      .update(loans)
      .set({
        returnedAt: new Date(),
        status: 'RETURNED',
        closedByUserId: returnedByUserId,
      })
      .where(eq(loans.id, loanId))
      .returning();
    return returned;
  }

  async getActiveLoans(): Promise<(Loan & { student: Student; item: Item })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(students, eq(loans.studentId, students.id))
      .innerJoin(items, eq(loans.itemId, items.id))
      .where(or(eq(loans.status, 'TAKEN'), eq(loans.status, 'OVERDUE')))
      .orderBy(desc(loans.takenAt));

    return result.map(row => ({
      ...row.loans,
      student: row.students,
      item: row.items,
    }));
  }

  async getOverdueLoans(): Promise<(Loan & { student: Student; item: Item })[]> {
    const result = await db
      .select()
      .from(loans)
      .innerJoin(students, eq(loans.studentId, students.id))
      .innerJoin(items, eq(loans.itemId, items.id))
      .where(eq(loans.status, 'OVERDUE'))
      .orderBy(desc(loans.takenAt));

    return result.map(row => ({
      ...row.loans,
      student: row.students,
      item: row.items,
    }));
  }

  async getAllLoans(filters?: {
    status?: string;
    studentId?: string;
    itemId?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<(Loan & { student: Student; item: Item; createdBy: User })[]> {
    const conditions = [];
    
    if (filters?.status) {
      conditions.push(eq(loans.status, filters.status as any));
    }
    if (filters?.studentId) {
      conditions.push(eq(loans.studentId, filters.studentId));
    }
    if (filters?.itemId) {
      conditions.push(eq(loans.itemId, filters.itemId));
    }
    if (filters?.fromDate) {
      conditions.push(gte(loans.takenAt, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(loans.takenAt, filters.toDate));
    }

    const result = await db
      .select()
      .from(loans)
      .innerJoin(students, eq(loans.studentId, students.id))
      .innerJoin(items, eq(loans.itemId, items.id))
      .innerJoin(users, eq(loans.createdByUserId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(loans.takenAt));

    return result.map(row => ({
      ...row.loans,
      student: row.students,
      item: row.items,
      createdBy: row.users,
    }));
  }

  async markLoansOverdue(maxLoanHours: number): Promise<number> {
    const cutoffTime = new Date(Date.now() - maxLoanHours * 60 * 60 * 1000);
    
    const result = await db
      .update(loans)
      .set({ status: 'OVERDUE' })
      .where(
        and(
          eq(loans.status, 'TAKEN'),
          lte(loans.takenAt, cutoffTime),
          isNull(loans.returnedAt)
        )
      );

    return result.rowCount || 0;
  }

  // Audit Logs
  async createAuditLog(log: InsertAuditLog): Promise<AuditLog> {
    const [created] = await db.insert(auditLogs).values(log).returning();
    return created;
  }

  async getAuditLogs(filters?: {
    actorUserId?: string;
    action?: string;
    entity?: string;
    fromDate?: Date;
    toDate?: Date;
  }): Promise<(AuditLog & { actor?: User })[]> {
    const conditions = [];
    
    if (filters?.actorUserId) {
      conditions.push(eq(auditLogs.actorUserId, filters.actorUserId));
    }
    if (filters?.action) {
      conditions.push(eq(auditLogs.action, filters.action as any));
    }
    if (filters?.entity) {
      conditions.push(eq(auditLogs.entity, filters.entity));
    }
    if (filters?.fromDate) {
      conditions.push(gte(auditLogs.at, filters.fromDate));
    }
    if (filters?.toDate) {
      conditions.push(lte(auditLogs.at, filters.toDate));
    }

    const result = await db
      .select()
      .from(auditLogs)
      .leftJoin(users, eq(auditLogs.actorUserId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(auditLogs.at));

    return result.map(row => ({
      ...row.audit_logs,
      actor: row.users || undefined,
    }));
  }

  // Stats
  async getStats(): Promise<{
    itemsOut: number;
    overdue: number;
    returnsToday: number;
    available: number;
    totalStudents: number;
    totalItems: number;
  }> {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [
      itemsOutResult,
      overdueResult,
      returnsTodayResult,
      totalStudentsResult,
      totalItemsResult,
    ] = await Promise.all([
      db.select({ count: count() }).from(loans).where(or(eq(loans.status, 'TAKEN'), eq(loans.status, 'OVERDUE'))),
      db.select({ count: count() }).from(loans).where(eq(loans.status, 'OVERDUE')),
      db.select({ count: count() }).from(loans).where(
        and(
          eq(loans.status, 'RETURNED'),
          gte(loans.returnedAt, startOfDay),
          lte(loans.returnedAt, endOfDay)
        )
      ),
      db.select({ count: count() }).from(students),
      db.select({ count: count() }).from(items).where(eq(items.isActive, true)),
    ]);

    const availableItems = await this.getAvailableItems();

    return {
      itemsOut: itemsOutResult[0].count,
      overdue: overdueResult[0].count,
      returnsToday: returnsTodayResult[0].count,
      available: availableItems.length,
      totalStudents: totalStudentsResult[0].count,
      totalItems: totalItemsResult[0].count,
    };
  }
}

export const storage = new DatabaseStorage();
