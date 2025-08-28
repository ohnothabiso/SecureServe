import cron from 'node-cron';
import { storage } from '../storage';
import { AuditService } from '../services/auditService';

const MAX_LOAN_HOURS = parseInt(process.env.MAX_LOAN_HOURS || '4', 10);

export function startScheduledJobs() {
  // Check for overdue loans every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      const overdueCount = await storage.markLoansOverdue(MAX_LOAN_HOURS);
      if (overdueCount > 0) {
        console.log(`Marked ${overdueCount} loans as overdue`);
        await AuditService.log({
          action: 'LOAN_OVERDUE',
          entity: 'System',
          diff: { overdueCount, maxLoanHours: MAX_LOAN_HOURS },
        });
      }
    } catch (error) {
      console.error('Error checking for overdue loans:', error);
    }
  });

  // Daily backup placeholder (would implement actual backup logic)
  cron.schedule('0 2 * * *', async () => {
    try {
      console.log('Daily backup job triggered');
      // Implement backup logic here
      await AuditService.log({
        action: 'SETTINGS_CHANGE',
        entity: 'System',
        diff: { action: 'daily_backup' },
      });
    } catch (error) {
      console.error('Error during daily backup:', error);
    }
  });

  console.log('Scheduled jobs started');
}
