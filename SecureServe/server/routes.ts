import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import cors from "cors";
import { 
  authenticateToken, 
  generateTokens, 
  setRefreshTokenCookie, 
  clearRefreshTokenCookie, 
  verifyRefreshToken,
  type AuthenticatedRequest 
} from "./middleware/auth";
import { requireAdmin, requireClerkOrAdmin, requireAnyRole } from "./middleware/rbac";
import { authRateLimit, mutationRateLimit } from "./middleware/rateLimiter";
import { AuditService } from "./services/auditService";
import { startScheduledJobs } from "./jobs/scheduler";
import { 
  loginSchema, 
  insertUserSchema, 
  insertStudentSchema, 
  insertItemSchema, 
  insertLoanSchema 
} from "@shared/schema";
import { z } from "zod";
import { randomUUID } from "crypto";

export async function registerRoutes(app: Express): Promise<Server> {
  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
        connectSrc: ["'self'", "ws:", "wss:"],
        fontSrc: ["'self'", "data:"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5000',
    credentials: true,
  }));
  
  app.use(cookieParser());
  
  // Request ID middleware
  app.use((req, res, next) => {
    req.headers['x-request-id'] = req.headers['x-request-id'] || randomUUID();
    res.setHeader('X-Request-Id', req.headers['x-request-id']);
    next();
  });

  // Start scheduled jobs
  startScheduledJobs();

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Authentication routes
  app.post('/api/auth/login', authRateLimit, async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || !user.isActive) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is locked
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        return res.status(423).json({ 
          message: 'Account temporarily locked due to too many failed attempts' 
        });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        // Increment failed login attempts
        const failedAttempts = (user.failedLoginAttempts || 0) + 1;
        const updates: any = { failedLoginAttempts: failedAttempts };
        
        // Lock account after 5 failed attempts for 15 minutes
        if (failedAttempts >= 5) {
          updates.lockedUntil = new Date(Date.now() + 15 * 60 * 1000);
        }
        
        await storage.updateUser(user.id, updates);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Reset failed login attempts and update last login
      await storage.updateUser(user.id, {
        failedLoginAttempts: 0,
        lockedUntil: null,
        lastLoginAt: new Date(),
      });

      const { accessToken, refreshToken } = generateTokens(user);
      setRefreshTokenCookie(res, refreshToken);

      // Log successful login
      await AuditService.logUserLogin(user.id, req.ip, req.get('User-Agent'));

      res.json({ 
        accessToken, 
        user: { 
          id: user.id, 
          email: user.email, 
          role: user.role 
        } 
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  app.post('/api/auth/refresh', async (req, res) => {
    try {
      const isProduction = process.env.NODE_ENV === 'production';
      const cookieName = isProduction ? '__Host-refreshToken' : 'refreshToken';
      const refreshToken = req.cookies[cookieName];

      if (!refreshToken) {
        return res.status(401).json({ message: 'Refresh token required' });
      }

      const decoded = verifyRefreshToken(refreshToken);
      const user = await storage.getUser(decoded.userId);

      if (!user || !user.isActive) {
        clearRefreshTokenCookie(res);
        return res.status(401).json({ message: 'User not found or inactive' });
      }

      const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
      setRefreshTokenCookie(res, newRefreshToken);

      res.json({ accessToken });
    } catch (error) {
      clearRefreshTokenCookie(res);
      res.status(401).json({ message: 'Invalid refresh token' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    clearRefreshTokenCookie(res);
    res.json({ message: 'Logged out successfully' });
  });

  // Get current user
  app.get('/api/me', authenticateToken, (req: AuthenticatedRequest, res) => {
    res.json({ 
      id: req.user!.id, 
      email: req.user!.email, 
      role: req.user!.role 
    });
  });

  // Student routes
  app.get('/api/students', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const { query } = req.query;
      let students;
      
      if (query && typeof query === 'string') {
        students = await storage.searchStudents(query);
      } else {
        students = await storage.getAllStudents();
      }
      
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Failed to fetch students' });
    }
  });

  app.post('/api/students', authenticateToken, requireClerkOrAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const studentData = insertStudentSchema.parse(req.body);
      const student = await storage.createStudent(studentData);
      
      await AuditService.log({
        actorUserId: req.user!.id,
        action: 'STUDENT_CREATE',
        entity: 'Student',
        entityId: student.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        diff: { created: student },
      });
      
      res.status(201).json(student);
    } catch (error) {
      console.error('Error creating student:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create student' });
    }
  });

  app.get('/api/students/:id', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const student = await storage.getStudent(req.params.id);
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }
      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Failed to fetch student' });
    }
  });

  // Item routes
  app.get('/api/items', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const { query, category, isActive } = req.query;
      const items = await storage.searchItems(
        query as string,
        category as string,
        isActive !== undefined ? isActive === 'true' : undefined
      );
      res.json(items);
    } catch (error) {
      console.error('Error fetching items:', error);
      res.status(500).json({ message: 'Failed to fetch items' });
    }
  });

  app.get('/api/items/available', authenticateToken, requireClerkOrAdmin, async (req, res) => {
    try {
      const items = await storage.getAvailableItems();
      res.json(items);
    } catch (error) {
      console.error('Error fetching available items:', error);
      res.status(500).json({ message: 'Failed to fetch available items' });
    }
  });

  app.post('/api/items', authenticateToken, requireAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const itemData = insertItemSchema.parse(req.body);
      const item = await storage.createItem(itemData);
      
      await AuditService.logItemCreate(item, req.user!.id, req.ip, req.get('User-Agent'));
      
      res.status(201).json(item);
    } catch (error) {
      console.error('Error creating item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create item' });
    }
  });

  app.put('/api/items/:id', authenticateToken, requireAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const updates = insertItemSchema.partial().parse(req.body);
      const item = await storage.updateItem(req.params.id, updates);
      
      await AuditService.log({
        actorUserId: req.user!.id,
        action: 'ITEM_UPDATE',
        entity: 'Item',
        entityId: item.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        diff: { updated: updates },
      });
      
      res.json(item);
    } catch (error) {
      console.error('Error updating item:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to update item' });
    }
  });

  // Loan routes
  app.get('/api/loans', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const { status, studentId, itemId, from, to } = req.query;
      const filters: any = {};
      
      if (status) filters.status = status as string;
      if (studentId) filters.studentId = studentId as string;
      if (itemId) filters.itemId = itemId as string;
      if (from) filters.fromDate = new Date(from as string);
      if (to) filters.toDate = new Date(to as string);
      
      const loans = await storage.getAllLoans(filters);
      res.json(loans);
    } catch (error) {
      console.error('Error fetching loans:', error);
      res.status(500).json({ message: 'Failed to fetch loans' });
    }
  });

  app.get('/api/loans/active', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const loans = await storage.getActiveLoans();
      res.json(loans);
    } catch (error) {
      console.error('Error fetching active loans:', error);
      res.status(500).json({ message: 'Failed to fetch active loans' });
    }
  });

  app.post('/api/loans', authenticateToken, requireClerkOrAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const loanData = insertLoanSchema.parse(req.body);
      
      // Check if student exists, create if not
      let student = await storage.getStudentByStudentNo(loanData.studentId);
      if (!student) {
        return res.status(400).json({ message: 'Student not found. Please create student first.' });
      }

      // Check if item is available
      const item = await storage.getItem(loanData.itemId);
      if (!item || !item.isActive) {
        return res.status(400).json({ message: 'Item not found or inactive' });
      }

      // Check if item is currently on loan
      const activeLoans = await storage.getActiveLoans();
      const isItemOnLoan = activeLoans.some(loan => loan.itemId === loanData.itemId);
      if (isItemOnLoan) {
        return res.status(400).json({ message: 'Item is currently on loan' });
      }

      const loan = await storage.createLoan({
        studentId: student.id,
        itemId: loanData.itemId,
        destination: loanData.destination,
        cardReceived: loanData.cardReceived || false,
        notes: loanData.notes,
        createdByUserId: req.user!.id,
      });
      
      await AuditService.logLoanCreate(loan, req.user!.id, req.ip, req.get('User-Agent'));
      
      res.status(201).json(loan);
    } catch (error) {
      console.error('Error creating loan:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create loan' });
    }
  });

  app.post('/api/loans/:id/return', authenticateToken, requireClerkOrAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const loanId = req.params.id;
      const loan = await storage.getLoan(loanId);
      
      if (!loan) {
        return res.status(404).json({ message: 'Loan not found' });
      }
      
      if (loan.status === 'RETURNED') {
        return res.status(400).json({ message: 'Loan already returned' });
      }
      
      const returnedLoan = await storage.returnLoan(loanId, req.user!.id);
      
      await AuditService.logLoanReturn(loanId, req.user!.id, req.ip, req.get('User-Agent'));
      
      res.json(returnedLoan);
    } catch (error) {
      console.error('Error returning loan:', error);
      res.status(500).json({ message: 'Failed to return loan' });
    }
  });

  // User management routes (Admin only)
  app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Remove password hashes from response
      const safeUsers = users.map(({ passwordHash, ...user }) => user);
      res.json(safeUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ message: 'Failed to fetch users' });
    }
  });

  app.post('/api/users', authenticateToken, requireAdmin, mutationRateLimit, async (req: AuthenticatedRequest, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'User with this email already exists' });
      }
      
      const user = await storage.createUser(userData);
      
      await AuditService.log({
        actorUserId: req.user!.id,
        action: 'USER_CREATE',
        entity: 'User',
        entityId: user.id,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        diff: { created: { ...user, passwordHash: '[REDACTED]' } },
      });
      
      // Remove password hash from response
      const { passwordHash, ...safeUser } = user;
      res.status(201).json(safeUser);
    } catch (error) {
      console.error('Error creating user:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: 'Validation error', errors: error.errors });
      }
      res.status(500).json({ message: 'Failed to create user' });
    }
  });

  // Audit log routes
  app.get('/api/audit', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const { actor, action, entity, from, to } = req.query;
      const filters: any = {};
      
      if (actor) filters.actorUserId = actor as string;
      if (action) filters.action = action as string;
      if (entity) filters.entity = entity as string;
      if (from) filters.fromDate = new Date(from as string);
      if (to) filters.toDate = new Date(to as string);
      
      const logs = await storage.getAuditLogs(filters);
      res.json(logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      res.status(500).json({ message: 'Failed to fetch audit logs' });
    }
  });

  // Stats route
  app.get('/api/stats', authenticateToken, requireAnyRole, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (error) {
      console.error('Error fetching stats:', error);
      res.status(500).json({ message: 'Failed to fetch stats' });
    }
  });

  // Export route (placeholder)
  app.get('/api/export/:entity', authenticateToken, requireAnyRole, async (req: AuthenticatedRequest, res) => {
    try {
      const entity = req.params.entity;
      
      await AuditService.logExport(entity, req.user!.id, req.ip, req.get('User-Agent'));
      
      // Placeholder - would implement actual CSV/PDF export
      res.json({ message: `Export ${entity} functionality would be implemented here` });
    } catch (error) {
      console.error('Error exporting:', error);
      res.status(500).json({ message: 'Export failed' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
