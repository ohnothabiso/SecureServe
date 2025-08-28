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
  Filter,
  TrendingUp,
  Activity
} from "lucide-react";
import NewLoanForm from "@/components/forms/new-loan-form";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { motion } from "framer-motion";

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
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="glass-effect border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl bg-gradient-to-br from-blue-500/10 to-blue-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Items Currently Out</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2" data-testid="text-items-out">
                      {stats.itemsOut}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">+12% from last week</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowRight className="text-white text-2xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="glass-effect border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl bg-gradient-to-br from-red-500/10 to-red-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Overdue Items</p>
                    <p className="text-3xl font-bold text-red-600 mt-2" data-testid="text-overdue">
                      {stats.overdue}
                    </p>
                    <div className="flex items-center mt-2">
                      <Activity className="w-4 h-4 text-red-500 mr-1" />
                      <span className="text-xs text-red-600 font-medium">Needs attention</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <AlertTriangle className="text-white text-2xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="glass-effect border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl bg-gradient-to-br from-green-500/10 to-green-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Returns Today</p>
                    <p className="text-3xl font-bold text-green-600 mt-2" data-testid="text-returns-today">
                      {stats.returnsToday}
                    </p>
                    <div className="flex items-center mt-2">
                      <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                      <span className="text-xs text-green-600 font-medium">On schedule</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <ArrowLeft className="text-white text-2xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            whileHover={{ scale: 1.05, y: -5 }}
          >
            <Card className="glass-effect border-white/30 shadow-xl hover:shadow-2xl transition-all duration-300 backdrop-blur-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 text-sm font-medium">Available Items</p>
                    <p className="text-3xl font-bold text-slate-900 mt-2" data-testid="text-available">
                      {stats.available}
                    </p>
                    <div className="flex items-center mt-2">
                      <Activity className="w-4 h-4 text-blue-500 mr-1" />
                      <span className="text-xs text-blue-600 font-medium">Ready to loan</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                    <Package className="text-white text-2xl" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Currently Out Items */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Card className="glass-effect border-white/30 shadow-xl backdrop-blur-xl bg-white/50">
            <div className="p-6 border-b border-white/20">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-slate-900">Currently Out</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                    <Input
                      type="search"
                      placeholder="Search loans..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 w-64 bg-white/60 border-white/30 backdrop-blur-sm focus:bg-white/80 transition-all duration-200"
                      data-testid="input-search-loans"
                    />
                  </div>
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button variant="ghost" size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm transition-all duration-200">
                      <Filter className="h-4 w-4" />
                    </Button>
                  </motion.div>
                </div>
              </div>
            </div>
          
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/20 backdrop-blur-sm border-b border-white/20">
                  <tr className="text-left">
                    <th className="px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Item
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Destination
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-xs font-semibold text-slate-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/20">
                  {filteredLoans.map((loan, index) => (
                    <motion.tr 
                      key={loan.id} 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className="hover:bg-white/30 transition-all duration-200 group" 
                      data-testid={`row-loan-${loan.id}`}
                    >
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">
                            {loan.student.name} {loan.student.surname}
                          </p>
                          {loan.student.roomNo && (
                            <p className="text-sm text-slate-600">Room {loan.student.roomNo}</p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900">{loan.item.name}</p>
                          {loan.item.assetTag && (
                            <p className="text-sm text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded text-xs inline-block">
                              {loan.item.assetTag}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-medium text-slate-900">{loan.destination}</span>
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(loan.status)}
                      </td>
                      <td className="px-6 py-4">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                          <Button
                            size="sm"
                            className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 group-hover:shadow-green-500/25"
                            data-testid={`button-return-${loan.id}`}
                          >
                            Return
                          </Button>
                        </motion.div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              
              {filteredLoans.length === 0 && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-12 text-center"
                >
                  <div className="w-20 h-20 mx-auto mb-4 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-slate-500" />
                  </div>
                  <p className="text-slate-600 font-medium text-lg">
                    {activeLoans.length === 0 ? "No active loans" : "No loans match your search"}
                  </p>
                  <p className="text-slate-500 text-sm mt-2">
                    {activeLoans.length === 0 ? "All items are currently available" : "Try adjusting your search criteria"}
                  </p>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
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
