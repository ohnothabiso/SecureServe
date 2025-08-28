import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";

interface Loan {
  id: string;
  student: {
    name: string;
    surname: string;
    studentNo: string;
    roomNo?: string;
  };
  item: {
    name: string;
    assetTag?: string;
  };
  destination: string;
  status: string;
  takenAt: string;
  returnedAt?: string;
  cardReceived: boolean;
  notes?: string;
}

interface LoansTableProps {
  loans: Loan[];
  showReturnButton?: boolean;
}

export default function LoansTable({ loans, showReturnButton = false }: LoansTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const returnLoanMutation = useMutation({
    mutationFn: async (loanId: string) => {
      return apiRequest('POST', `/api/loans/${loanId}/return`);
    },
    onSuccess: () => {
      toast({
        title: "Loan Returned",
        description: "The loan has been successfully returned.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to return loan",
        variant: "destructive",
      });
    },
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OVERDUE':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'TAKEN':
        return <Badge variant="secondary">Active</Badge>;
      case 'RETURNED':
        return <Badge variant="default">Returned</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleReturn = (loanId: string) => {
    returnLoanMutation.mutate(loanId);
  };

  return (
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
              Taken At
            </th>
            {showReturnButton && (
              <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {loans.map((loan) => (
            <tr key={loan.id} className="hover:bg-slate-50" data-testid={`row-loan-${loan.id}`}>
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">
                    {loan.student.name} {loan.student.surname}
                  </p>
                  <p className="text-sm text-slate-600">
                    {loan.student.studentNo}
                    {loan.student.roomNo && ` • Room ${loan.student.roomNo}`}
                  </p>
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
              <td className="px-6 py-4 text-sm text-slate-900">
                {format(new Date(loan.takenAt), 'MMM dd, yyyy HH:mm')}
              </td>
              {showReturnButton && (
                <td className="px-6 py-4">
                  {loan.status !== 'RETURNED' && (
                    <Button
                      size="sm"
                      onClick={() => handleReturn(loan.id)}
                      disabled={returnLoanMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                      data-testid={`button-return-${loan.id}`}
                    >
                      {returnLoanMutation.isPending ? "Returning..." : "Return"}
                    </Button>
                  )}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      
      {loans.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No loans found
        </div>
      )}
    </div>
  );
}
