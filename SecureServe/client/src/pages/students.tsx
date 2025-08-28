import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { insertStudentSchema } from "@shared/schema";
import { Plus, Search, Edit } from "lucide-react";
import { z } from "zod";

const studentFormSchema = insertStudentSchema;

type StudentFormData = z.infer<typeof studentFormSchema>;

interface Student {
  id: string;
  studentNo: string;
  name: string;
  surname: string;
  roomNo?: string;
  createdAt: string;
}

export default function StudentsPage() {
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      studentNo: "",
      name: "",
      surname: "",
      roomNo: "",
    },
  });

  const { data: students = [], isLoading } = useQuery<Student[]>({
    queryKey: ['/api/students', { query: searchQuery }],
  });

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      if (editingStudent) {
        return apiRequest('PUT', `/api/students/${editingStudent.id}`, data);
      } else {
        return apiRequest('POST', '/api/students', data);
      }
    },
    onSuccess: () => {
      toast({
        title: editingStudent ? "Student Updated" : "Student Created",
        description: `The student has been successfully ${editingStudent ? 'updated' : 'created'}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/students'] });
      setShowStudentForm(false);
      setEditingStudent(null);
      form.reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || `Failed to ${editingStudent ? 'update' : 'create'} student`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: StudentFormData) => {
    createStudentMutation.mutate(data);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.reset({
      studentNo: student.studentNo,
      name: student.name,
      surname: student.surname,
      roomNo: student.roomNo || "",
    });
    setShowStudentForm(true);
  };

  const handleNewStudent = () => {
    setEditingStudent(null);
    form.reset();
    setShowStudentForm(true);
  };

  const filteredStudents = students.filter(student => 
    searchQuery === "" || 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.surname.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.studentNo.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (student.roomNo && student.roomNo.toLowerCase().includes(searchQuery.toLowerCase()))
  );

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
        title="Student Management"
        description="Manage student records and information"
        action={{
          label: "Add Student",
          onClick: handleNewStudent,
          icon: <Plus className="mr-2 h-4 w-4" />,
        }}
      />

      <div className="p-6 overflow-y-auto h-full">
        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="search"
                placeholder="Search students..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                data-testid="input-search-students"
              />
            </div>
          </CardContent>
        </Card>

        {/* Students Table */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left">
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student Details
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Student Number
                  </th>
                  <th className="px-6 py-3 text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Room Number
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
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50" data-testid={`row-student-${student.id}`}>
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-medium text-slate-900">
                          {student.name} {student.surname}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="px-2 py-1 bg-slate-100 text-slate-800 text-sm rounded">
                        {student.studentNo}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {student.roomNo || 'Not assigned'}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-900">
                      {new Date(student.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(student)}
                        data-testid={`button-edit-${student.id}`}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {filteredStudents.length === 0 && (
              <div className="p-8 text-center text-slate-500">
                {students.length === 0 ? "No students found" : "No students match your search"}
              </div>
            )}
          </div>
          
          {/* Pagination placeholder */}
          <div className="px-6 py-3 border-t border-slate-200 flex items-center justify-between">
            <p className="text-sm text-slate-700" data-testid="text-pagination-info">
              Showing {filteredStudents.length} students
            </p>
          </div>
        </Card>
      </div>

      {/* Student Form Dialog */}
      <Dialog open={showStudentForm} onOpenChange={setShowStudentForm}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingStudent ? 'Edit Student' : 'Add New Student'}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-2">
                  First Name
                </Label>
                <Input
                  id="name"
                  {...form.register("name")}
                  placeholder="Enter first name"
                  data-testid="input-student-name"
                />
                {form.formState.errors.name && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.name.message}</p>
                )}
              </div>

              <div>
                <Label htmlFor="surname" className="block text-sm font-medium text-slate-700 mb-2">
                  Last Name
                </Label>
                <Input
                  id="surname"
                  {...form.register("surname")}
                  placeholder="Enter last name"
                  data-testid="input-student-surname"
                />
                {form.formState.errors.surname && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.surname.message}</p>
                )}
              </div>
            </div>

            <div>
              <Label htmlFor="studentNo" className="block text-sm font-medium text-slate-700 mb-2">
                Student Number
              </Label>
              <Input
                id="studentNo"
                {...form.register("studentNo")}
                placeholder="Enter student number"
                data-testid="input-student-number"
              />
              {form.formState.errors.studentNo && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.studentNo.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="roomNo" className="block text-sm font-medium text-slate-700 mb-2">
                Room Number (Optional)
              </Label>
              <Input
                id="roomNo"
                {...form.register("roomNo")}
                placeholder="e.g. 204A"
                data-testid="input-room-number"
              />
            </div>

            <div className="flex justify-end space-x-4 pt-4">
              <Button 
                type="button" 
                variant="outline"
                onClick={() => setShowStudentForm(false)}
                data-testid="button-cancel"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={createStudentMutation.isPending}
                data-testid="button-save-student"
              >
                {createStudentMutation.isPending 
                  ? (editingStudent ? "Updating..." : "Creating...") 
                  : (editingStudent ? "Update Student" : "Create Student")
                }
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
