import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Edit, Power } from "lucide-react";

interface Item {
  id: string;
  name: string;
  category: string;
  specification?: string;
  assetTag?: string;
  isActive: boolean;
  createdAt: string;
}

interface ItemsTableProps {
  items: Item[];
  onEdit?: (item: Item) => void;
}

export default function ItemsTable({ items, onEdit }: ItemsTableProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ itemId, isActive }: { itemId: string; isActive: boolean }) => {
      return apiRequest('PUT', `/api/items/${itemId}`, { isActive });
    },
    onSuccess: () => {
      toast({
        title: "Item Updated",
        description: "The item status has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update item",
        variant: "destructive",
      });
    },
  });

  const handleToggleActive = (itemId: string, currentStatus: boolean) => {
    toggleActiveMutation.mutate({ itemId, isActive: !currentStatus });
  };

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? (
      <Badge variant="default" className="bg-green-100 text-green-800">Available</Badge>
    ) : (
      <Badge variant="secondary">Inactive</Badge>
    );
  };

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-slate-50 border-b border-slate-200">
          <tr className="text-left">
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Item Details
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
              Asset Tag
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
          {items.map((item) => (
            <tr key={item.id} className="hover:bg-slate-50" data-testid={`row-item-${item.id}`}>
              <td className="px-6 py-4">
                <div>
                  <p className="font-medium text-slate-900">{item.name}</p>
                  {item.specification && (
                    <p className="text-sm text-slate-600">{item.specification}</p>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-slate-900">{item.category}</td>
              <td className="px-6 py-4">
                {item.assetTag ? (
                  <code className="px-2 py-1 bg-slate-100 text-slate-800 text-sm rounded">
                    {item.assetTag}
                  </code>
                ) : (
                  <span className="text-slate-400">No tag</span>
                )}
              </td>
              <td className="px-6 py-4">
                {getStatusBadge(item.isActive)}
              </td>
              <td className="px-6 py-4">
                <div className="flex space-x-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                      data-testid={`button-edit-${item.id}`}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(item.id, item.isActive)}
                    disabled={toggleActiveMutation.isPending}
                    data-testid={`button-toggle-${item.id}`}
                  >
                    <Power className="h-4 w-4" />
                    {item.isActive ? 'Deactivate' : 'Activate'}
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {items.length === 0 && (
        <div className="p-8 text-center text-slate-500">
          No items found
        </div>
      )}
    </div>
  );
}
