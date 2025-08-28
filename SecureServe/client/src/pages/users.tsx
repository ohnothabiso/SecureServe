import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { insertUserSchema } from "@shared/schema";
import { Plus, Edit, Shield, ShieldCheck, Key } from "lucide-react";
import { z } from "zod";
import { format } from "date-fns";

const userFormSchema = insertUserSchema;

type UserFormData = z.infer<typeof userFormSchema>;

interface User {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
  failedLoginAttempts: number;
}

export default function UsersPage() {
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<UserFormData>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      email: "",
      password: "",
      role: "CLERK",
      isActive: true,
    },
  });

  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/users'],
    enabled: currentUser?.role === 'ADMIN',
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      if (editingUser) {
        // Don't send password if editing and it's empty
        const updateData: Partial<UserFormData> = { ...data };
        if (!updateData.password) {
          updateData.password = undefined;
        }
        return apiRequest('PUT', `/api/users/${editingUser.id}`, updateData);
      } else {
        return apiRequest('POST', '/api/users', data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingUser ? "User Updated" : "User Created",
        description: `The user has been successfully ${editingUser ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/users'] });
      setShowUserForm(false);
      setEditingUser(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingUser ? 'update' : 'create'} user`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UserFormData) => {
    createUserMutation.mutate(data);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    form.reset({
      email: user.email,
      password: "", // Don't populate password for editing
      role: user.role as any,
      isActive: user.isActive,
    });
    setShowUserForm(true);
  };

  const handleNewUser = () => {
    setEditingUser(null);
    form.reset();
    setShowUserForm(true);
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return <Badge variant="destructive"><ShieldCheck className="h-3 w-3 mr-1" />Admin</Badge>;
      case 'CLERK':
        return <Badge variant="default"><Shield className="h-3 w-3 mr-1" />Clerk</Badge>;
      case 'AUDITOR':
        return <Badge variant="secondary"><Shield className="h-3 w-3 mr-1" />Auditor</Badge>;
      default:
        return <Badge variant="outline">{role}</Badge>;
    }
  };

  const getStatusBadge = (isActive: boolean, failedAttempts: number) => {
    if (!isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    if (failedAttempts >= 5) {
      return <Badge variant="destructive">Locked</Badge>;
    }
    return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
  };

  if (currentUser?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="h-16 w-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-slate-900 mb-2">Access Denied</h2>
          <p className="text-slate-600">You need administrator privileges to access this page.</p>
        </div>
      </div>
    );
  }

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
        title="User Management"
        description="Manage system users and permissions"
        action={{
          label: "Add User",
          onClick: handleNewUser,
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Users Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50" data-testid={`row-user-${user.id}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.email.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-slate-900">{user.email}</p>
                          {user.failedLoginAttempts > 0 && (
                            <p className="text-sm text-red-600">
                              {user.failedLoginAttempts} failed attempts
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getRoleBadge(user.role)}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.isActive, user.failedLoginAttempts)}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {user.lastLoginAt 
                        ? format(new Date(user.lastLoginAt), 'MMM dd, yyyy HH:mm')
                        : 'Never'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(user)}
                          data-testid={`button-edit-${user.id}`}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          data-testid={`button-reset-password-${user.id}`}
                        >
                          <Key className="h-4 w-4 mr-1" />
                          Reset
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {users.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                No users found
              </div>
            )}
          </div>
          
          {/* Pagination placeholder */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-700" data-testid="text-pagination-info">
              Showing {users.length} users
            </p>
          </div>
        </Card>
      </div>

      {/* User Form Dialog */}
      <Dialog open={showUserForm} onOpenChange={setShowUserForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingUser ? 'Edit User' : 'Add New User'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                Email Address
              </Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="Enter email address"
                disabled={!!editingUser}
                data-testid="input-user-email"
              />
              {form.formState.errors.email && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                Password {editingUser && "(leave blank to keep current)"}
              </Label>
              <Input
                id="password"
                type="password"
                {...form.register("password")}
                placeholder={editingUser ? "Leave blank to keep current" : "Enter password"}
                data-testid="input-user-password"
              />
              {form.formState.errors.password && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.password.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="role" className="block text-sm font-medium text-slate-700 mb-2">
                Role
              </Label>
              <Select 
                value={form.watch("role")} 
                onValueChange={(value) => form.setValue("role", value as any)}
                data-testid="select-user-role"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">Administrator</SelectItem>
                  <SelectItem value="CLERK">Clerk</SelectItem>
                  <SelectItem value="AUDITOR">Auditor</SelectItem>
                </SelectContent>
              </Select>
              {form.formState.errors.role && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.role.message}</p>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isActive"
                checked={form.watch("isActive")}
                onChange={(e) => form.setValue("isActive", e.target.checked)}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-slate-300 rounded"
                data-testid="checkbox-user-active"
              />
              <Label htmlFor="isActive" className="text-sm text-slate-700">
                User account is active
              </Label>
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowUserForm(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createUserMutation.isPending}
                data-testid="button-save-user"
              >
                {createUserMutation.isPending 
                  ? (editingUser ? "Updating..." : "Creating...") 
                  : (editingUser ? "Update User" : "Create User")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
