import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

interface AuditLog {
  id: string;
  actorUserId?: string;
  actor?: {
    email: string;
    role: string;
  };
  action: string;
  entity: string;
  entityId?: string;
  ip?: string;
  userAgent?: string;
  at: string;
  diff?: any;
}

interface AuditTableProps {
  logs: AuditLog[];
}

export default function AuditTable({ logs }: AuditTableProps) {
  const getActionBadge = (action: string) => {
    const colorMap: Record<string, string> = {
      USER_LOGIN: 'bg-purple-100 text-purple-800',
      USER_CREATE: 'bg-blue-100 text-blue-800',
      USER_UPDATE: 'bg-blue-100 text-blue-800',
      LOAN_CREATE: 'bg-blue-100 text-blue-800',
      LOAN_RETURN: 'bg-green-100 text-green-800',
      LOAN_OVERDUE: 'bg-amber-100 text-amber-800',
      ITEM_CREATE: 'bg-indigo-100 text-indigo-800',
      ITEM_UPDATE: 'bg-indigo-100 text-indigo-800',
      STUDENT_CREATE: 'bg-cyan-100 text-cyan-800',
      EXPORT: 'bg-orange-100 text-orange-800',
    };

    const className = colorMap[action] || 'bg-gray-100 text-gray-800';
    return (
      <Badge variant="secondary" className={className}>
        {action.replace(/_/g, ' ')}
      </Badge>
    );
  };

  const getUserInitials = (email?: string) => {
    if (!email) return 'SY';
    return email.split('@')[0].slice(0, 2).toUpperCase();
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Timestamp
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              User
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Action
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Entity
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Details
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              IP Address
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {logs.map((log) => (
            <tr key={log.id} className="hover:bg-slate-50" data-testid={`row-audit-${log.id}`}>
              <td className="px-6 py-4 text-sm text-slate-900">
                {format(new Date(log.at), 'MMM dd, yyyy HH:mm:ss')}
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">
                      {getUserInitials(log.actor?.email)}
                    </span>
                  </div>
                  <span className="text-sm text-slate-900">
                    {log.actor?.email || 'System'}
                  </span>
                </div>
              </td>
              <td className="px-6 py-4">
                {getActionBadge(log.action)}
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">
                {log.entity} {log.entityId && `#${log.entityId.slice(0, 8)}`}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {log.diff && typeof log.diff === 'object' ? (
                  <span className="font-mono text-xs">
                    {Object.keys(log.diff).join(', ')}
                  </span>
                ) : (
                  'No details'
                )}
              </td>
              <td className="px-6 py-4 text-sm text-slate-600">
                {log.ip || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {logs.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No audit logs found
        </div>
      )}
    </div>
  );
}
