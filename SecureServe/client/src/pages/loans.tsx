import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import LoansTable from "@/components/tables/loans-table";
import NewLoanForm from "@/components/forms/new-loan-form";
import { Download, Plus } from "lucide-react";

interface Loan {
  id: string;
  student: {
    id: string;
    name: string;
    surname: string;
    studentNo: string;
    roomNo?: string;
  };
  item: {
    id: string;
    name: string;
    assetTag?: string;
  };
  destination: string;
  status: string;
  takenAt: string;
  returnedAt?: string;
  cardReceived: boolean;
  notes?: string;
  createdBy: {
    email: string;
  };
}

export default function LoansPage() {
  const [showNewLoanForm, setShowNewLoanForm] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    studentId: "",
    itemId: "",
    fromDate: "",
    toDate: "",
  });

  const { data: loans = [], isLoading } = useQuery<Loan[]>({
    queryKey: ['/api/loans', filters],
  });

  const { data: students = [] } = useQuery<any[]>({
    queryKey: ['/api/students'],
  });

  const { data: items = [] } = useQuery<any[]>({
    queryKey: ['/api/items'],
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: "",
      studentId: "",
      itemId: "",
      fromDate: "",
      toDate: "",
    });
  };

  const handleExport = async () => {
    try {
      // This would implement actual export functionality
      console.log('Export loans functionality would be implemented here');
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
        title="Loan Management"
        description="Track and manage all item loans"
        action={{
          label: "New Loan",
          onClick: () => setShowNewLoanForm(true),
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
              <div>
                <Label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </Label>
                <Select 
                  value={filters.status} 
                  onValueChange={(value) => handleFilterChange("status", value)}
                  data-testid="select-status-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="TAKEN">Active</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="RETURNED">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="student" className="block text-sm font-medium text-slate-700 mb-2">
                  Student
                </Label>
                <Select 
                  value={filters.studentId} 
                  onValueChange={(value) => handleFilterChange("studentId", value)}
                  data-testid="select-student-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Students" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Students</SelectItem>
                    {students.map((student: any) => (
                      <SelectItem key={student.id} value={student.id}>
                        {student.name} {student.surname}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="item" className="block text-sm font-medium text-slate-700 mb-2">
                  Item
                </Label>
                <Select 
                  value={filters.itemId} 
                  onValueChange={(value) => handleFilterChange("itemId", value)}
                  data-testid="select-item-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Items" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Items</SelectItem>
                    {items.map((item: any) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

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

              <div className="flex items-end space-x-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  className="flex-1"
                  data-testid="button-clear-filters"
                >
                  Clear Filters
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleExport}
                  data-testid="button-export-loans"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Loans Table */}
        <Card>
          <LoansTable loans={loans} showReturnButton={true} />
          
          {/* Pagination placeholder */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-700" data-testid="text-pagination-info">
              Showing {loans.length} loans
            </p>
          </div>
        </Card>
      </div>

      {/* New Loan Form Dialog */}
      <Dialog open={showNewLoanForm} onOpenChange={setShowNewLoanForm}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <NewLoanForm onSuccess={() => setShowNewLoanForm(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
