import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import ItemsTable from "@/components/tables/items-table";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { insertItemSchema } from "@shared/schema";
import { Plus, Upload } from "lucide-react";
import { z } from "zod";

const itemFormSchema = insertItemSchema;

type ItemFormData = z.infer<typeof itemFormSchema>;

interface Item {
  id: string;
  name: string;
  category: string;
  specification?: string;
  assetTag?: string;
  isActive: boolean;
  createdAt: string;
}

export default function ItemsPage() {
  const [showItemForm, setShowItemForm] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [filters, setFilters] = useState({
    query: "",
    category: "",
    isActive: "",
  });

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ItemFormData>({
    resolver: zodResolver(itemFormSchema),
    defaultValues: {
      name: "",
      category: "",
      specification: "",
      assetTag: "",
      isActive: true,
    },
  });

  const { data: items = [], isLoading } = useQuery<Item[]>({
    queryKey: ['/api/items', filters],
  });

  const createItemMutation = useMutation({
    mutationFn: async (data: ItemFormData) => {
      if (editingItem) {
        return apiRequest('PUT', `/api/items/${editingItem.id}`, data);
      } else {
        return apiRequest('POST', '/api/items', data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingItem ? "Item Updated" : "Item Created",
        description: `The item has been successfully ${editingItem ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/items'] });
      setShowItemForm(false);
      setEditingItem(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingItem ? 'update' : 'create'} item`,
        variant: "destructive",
      });
    },
  });

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      query: "",
      category: "",
      isActive: "",
    });
  };

  const onSubmit = (data: ItemFormData) => {
    createItemMutation.mutate(data);
  };

  const handleEdit = (item: Item) => {
    setEditingItem(item);
    form.reset({
      name: item.name,
      category: item.category,
      specification: item.specification || "",
      assetTag: item.assetTag || "",
      isActive: item.isActive,
    });
    setShowItemForm(true);
  };

  const handleNewItem = () => {
    setEditingItem(null);
    form.reset();
    setShowItemForm(true);
  };

  // Get unique categories for filter
  const categories = Array.from(new Set(items.map(item => item.category)));

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
        title="Inventory Management"
        description="Manage items available for loan"
        action={user?.role === 'ADMIN' ? {
          label: "Add Item",
          onClick: handleNewItem,
          icon: <Plus className="mr-2 h-4 w-4" />,
        } : undefined}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="search" className="block text-sm font-medium text-slate-700 mb-2">
                  Search
                </Label>
                <Input
                  id="search"
                  placeholder="Search items..."
                  value={filters.query}
                  onChange={(e) => handleFilterChange("query", e.target.value)}
                  data-testid="input-search-items"
                />
              </div>

              <div>
                <Label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                  Category
                </Label>
                <Select 
                  value={filters.category} 
                  onValueChange={(value) => handleFilterChange("category", value)}
                  data-testid="select-category-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status" className="block text-sm font-medium text-slate-700 mb-2">
                  Status
                </Label>
                <Select 
                  value={filters.isActive} 
                  onValueChange={(value) => handleFilterChange("isActive", value)}
                  data-testid="select-status-filter"
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Statuses</SelectItem>
                    <SelectItem value="true">Active</SelectItem>
                    <SelectItem value="false">Inactive</SelectItem>
                  </SelectContent>
                </Select>
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
                {user?.role === 'ADMIN' && (
                  <Button variant="outline" data-testid="button-import-csv">
                    <Upload className="h-4 w-4 mr-2" />
                    Import CSV
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Items Table */}
        <Card>
          <ItemsTable 
            items={items} 
            onEdit={user?.role === 'ADMIN' ? handleEdit : undefined}
          />
          
          {/* Pagination placeholder */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-700" data-testid="text-pagination-info">
              Showing {items.length} items
            </p>
          </div>
        </Card>
      </div>

      {/* Item Form Dialog */}
      <Dialog open={showItemForm} onOpenChange={setShowItemForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Edit Item' : 'Add New Item'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                Item Name
              </Label>
              <Input
                id="name"
                {...form.register("name")}
                placeholder="Enter item name"
                data-testid="input-item-name"
              />
              {form.formState.errors.name && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="category" className="block text-sm font-medium text-slate-700 mb-2">
                Category
              </Label>
              <Input
                id="category"
                {...form.register("category")}
                placeholder="e.g. Cables & Adapters, Electronics"
                data-testid="input-item-category"
              />
              {form.formState.errors.category && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.category.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="assetTag" className="block text-sm font-medium text-slate-700 mb-2">
                Asset Tag (Optional)
              </Label>
              <Input
                id="assetTag"
                {...form.register("assetTag")}
                placeholder="e.g. AST-001"
                data-testid="input-asset-tag"
              />
            </div>

            <div>
              <Label htmlFor="specification" className="block text-sm font-medium text-slate-700 mb-2">
                Specification
              </Label>
              <Textarea
                id="specification"
                {...form.register("specification")}
                rows={3}
                placeholder="Enter item specifications or description..."
                data-testid="input-specification"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={form.watch("isActive")}
                onCheckedChange={(checked) => form.setValue("isActive", checked)}
                data-testid="switch-is-active"
              />
              <Label htmlFor="isActive" className="text-sm text-slate-700">
                Item is active and available for loans
              </Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowItemForm(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createItemMutation.isPending}
                data-testid="button-save-item"
              >
                {createItemMutation.isPending 
                  ? (editingItem ? "Updating..." : "Creating...") 
                  : (editingItem ? "Update Item" : "Create Item")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
