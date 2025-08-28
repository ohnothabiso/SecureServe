import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowRight, 
  AlertTriangle, 
  ArrowLeft, 
  Package,
  Search,
  Filter
} from "lucide-react";
import NewLoanForm from "@/components/forms/new-loan-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Stats {
  itemsOut: number;
  overdue: number;
  returnsToday: number;
  available: number;
}

interface ActiveLoan {
  id: string;
  student: {
    name: string;
    surname: string;
    roomNo?: string;
  };
  item: {
    name: string;
    assetTag?: string;
  };
  destination: string;
  status: string;
  takenAt: string;
}

export default function DashboardPage() {
  const [showNewLoanForm, setShowNewLoanForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const { data: stats = { itemsOut: 0, overdue: 0, returnsToday: 0, available: 0 } } = useQuery<Stats>({
    queryKey: ['/api/stats'],
  });

  const { data: activeLoans = [] } = useQuery<ActiveLoan[]>({
    queryKey: ['/api/loans/active'],
  });

  const filteredLoans = activeLoans.filter(loan => 
    searchQuery === "" || 
    loan.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.student.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loan.destination.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'TAKEN':
        return <Badge variant="secondary">Active</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <>
      <Header
        title="Dashboard"
        description="Overview of current reception activities"
        action={{
          label: "New Loan",
          onClick: () => setShowNewLoanForm(true),
        }}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Items Currently Out</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2" data-testid="text-items-out">
                    {stats.itemsOut}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <ArrowRight className="text-blue-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Overdue Items</p>
                  <p className="text-3xl font-bold text-red-600 mt-2" data-testid="text-overdue">
                    {stats.overdue}
                  </p>
                </div>
                <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Returns Today</p>
                  <p className="text-3xl font-bold text-green-600 mt-2" data-testid="text-returns-today">
                    {stats.returnsToday}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <ArrowLeft className="text-green-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-600 text-sm font-medium">Available Items</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2" data-testid="text-available">
                    {stats.available}
                  </p>
                </div>
                <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                  <Package className="text-slate-600 text-xl" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Currently Out Items */}
        <Card>
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-900">Currently Out</h2>
              <div className="flex items-center space-x-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                  <Input
                    type="search"
                    placeholder="Search loans..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 w-64"
                    data-testid="input-search-loans"
                  />
                </div>
                <Button variant="ghost" size="sm">
                  <Filter className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Item
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Destination
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredLoans.map((loan) => (
                  <tr key={loan.id} className="hover:bg-slate-50" data-testid={`row-loan-${loan.id}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {loan.student.name} {loan.student.surname}
                        </p>
                        {loan.student.roomNo && (
                          <p className="text-sm text-slate-600">Room {loan.student.roomNo}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">{loan.item.name}</p>
                        {loan.item.assetTag && (
                          <p className="text-sm text-slate-600">{loan.item.assetTag}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">{loan.destination}</td>
                    <td className="px-6 py-4">
                      {getStatusBadge(loan.status)}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        data-testid={`button-return-${loan.id}`}
                      >
                        Return
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredLoans.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                {activeLoans.length === 0 ? "No active loans" : "No loans match your search"}
              </div>
            )}
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
