import { storage } from '../storage';
import type { InsertAuditLog } from '@shared/schema';

export class AuditService {
  static async log(params: {
    actorUserId?: string;
    action: InsertAuditLog['action'];
    entity: string;
    entityId?: string;
    ip?: string;
    userAgent?: string;
    diff?: any;
  }): Promise<void> {
    try {
      await storage.createAuditLog({
        actorUserId: params.actorUserId,
        action: params.action,
        entity: params.entity,
        entityId: params.entityId,
        ip: params.ip,
        userAgent: params.userAgent,
        diff: params.diff ? JSON.parse(JSON.stringify(params.diff)) : null,
      });
    } catch (error) {
      console.error('Failed to create audit log:', error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  static async logUserLogin(userId: string, ip?: string, userAgent?: string) {
    await this.log({
      actorUserId: userId,
      action: 'USER_LOGIN',
      entity: 'User',
      entityId: userId,
      ip,
      userAgent,
    });
  }

  static async logLoanCreate(loan: any, createdByUserId: string, ip?: string, userAgent?: string) {
    await this.log({
      actorUserId: createdByUserId,
      action: 'LOAN_CREATE',
      entity: 'Loan',
      entityId: loan.id,
      ip,
      userAgent,
      diff: { created: loan },
    });
  }

  static async logLoanReturn(loanId: string, returnedByUserId: string, ip?: string, userAgent?: string) {
    await this.log({
      actorUserId: returnedByUserId,
      action: 'LOAN_RETURN',
      entity: 'Loan',
      entityId: loanId,
      ip,
      userAgent,
    });
  }

  static async logItemCreate(item: any, createdByUserId: string, ip?: string, userAgent?: string) {
    await this.log({
      actorUserId: createdByUserId,
      action: 'ITEM_CREATE',
      entity: 'Item',
      entityId: item.id,
      ip,
      userAgent,
      diff: { created: item },
    });
  }

  static async logExport(entity: string, actorUserId: string, ip?: string, userAgent?: string) {
    await this.log({
      actorUserId,
      action: 'EXPORT',
      entity,
      ip,
      userAgent,
    });
  }
}
