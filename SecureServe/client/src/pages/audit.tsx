import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AuditTable from "@/components/tables/audit-table";
import { Download } from "lucide-react";

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

export default function AuditPage() {
  const [filters, setFilters] = useState({
    actor: "",
    action: "",
    entity: "",
    fromDate: "",
    toDate: "",
  });

  const { data: auditLogs = [], isLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/audit', filters],
  });

  const { data: users = [] } = useQuery<any[]>({
    queryKey: ['/api/users'],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      actor: "",
      action: "",
      entity: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleExport = async () => {
    try {
      // This would implement actual export functionality
      console.log('Export audit logs functionality would be implemented here');
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <>
      <Header
        title="Audit Log"
        description="System activity and security audit trail"
        action={{
          label: "Export Log",
          onClick: handleExport,
          icon: <Download className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="fromDate" className="block text-sm font-medium text-slate-700 mb-2">
                  From Date
                </Label>
                <Input
                  id="fromDate"
                  type="date"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                  data-testid="input-from-date"
                />
              </div>

              <div>
                <Label htmlFor="toDate" className="block text-sm font-medium text-slate-700 mb-2">
                  To Date
                </Label>
                <Input
                  id="toDate"
                  type="date"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                  data-testid="input-to-date"
                />
              </div>

              <div>
                <Label htmlFor="user" className="block text-sm font-medium text-slate-700 mb-2">
                  User
                </Label>
                <Select 
                  value={filters.actor} 
                  onValueChange={(value) => handleFilterChange("actor", value)}
                  data-testid="select-user-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Users" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Users</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                    {users.map((user: any) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="action" className="block text-sm font-medium text-slate-700 mb-2">
                  Action Type
                </Label>
                <Select 
                  value={filters.action} 
                  onValueChange={(value) => handleFilterChange("action", value)}
                  data-testid="select-action-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Actions" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Actions</SelectItem>
                    <SelectItem value="USER_LOGIN">Login</SelectItem>
                    <SelectItem value="USER_CREATE">User Created</SelectItem>
                    <SelectItem value="USER_UPDATE">User Updated</SelectItem>
                    <SelectItem value="LOAN_CREATE">Loan Created</SelectItem>
                    <SelectItem value="LOAN_RETURN">Loan Returned</SelectItem>
                    <SelectItem value="LOAN_OVERDUE">Loan Overdue</SelectItem>
                    <SelectItem value="ITEM_CREATE">Item Created</SelectItem>
                    <SelectItem value="ITEM_UPDATE">Item Updated</SelectItem>
                    <SelectItem value="STUDENT_CREATE">Student Created</SelectItem>
                    <SelectItem value="EXPORT">Export</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="entity" className="block text-sm font-medium text-slate-700 mb-2">
                  Entity
                </Label>
                <Select 
                  value={filters.entity} 
                  onValueChange={(value) => handleFilterChange("entity", value)}
                  data-testid="select-entity-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Entities" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Entities</SelectItem>
                    <SelectItem value="User">User</SelectItem>
                    <SelectItem value="Student">Student</SelectItem>
                    <SelectItem value="Item">Item</SelectItem>
                    <SelectItem value="Loan">Loan</SelectItem>
                    <SelectItem value="System">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <Button 
                variant="outline" 
                onClick={clearFilters}
                data-testid="button-clear-filters"
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Audit Log Table */}
        <Card>
          <AuditTable logs={auditLogs} />
          
          {/* Pagination placeholder */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-700" data-testid="text-pagination-info">
              Showing {auditLogs.length} audit entries
            </p>
          </div>
        </Card>
      </div>
    </>
  );
}
