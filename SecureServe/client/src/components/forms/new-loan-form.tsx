import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertLoanSchema } from "@shared/schema";
import { z } from "zod";
import { Search, X } from "lucide-react";

const loanFormSchema = insertLoanSchema.extend({
  studentNumber: z.string().min(1, "Student number is required"),
  itemId: z.string().min(1, "Item selection is required"),
});

type LoanFormData = z.infer<typeof loanFormSchema>;

interface NewLoanFormProps {
  onSuccess: () => void;
}

interface Student {
  id: string;
  studentNo: string;
  name: string;
  surname: string;
  roomNo?: string;
}

interface Item {
  id: string;
  name: string;
  category: string;
  assetTag?: string;
  specification?: string;
}

export default function NewLoanForm({ onSuccess }: NewLoanFormProps) {
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [cardReceived, setCardReceived] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<LoanFormData>({
    resolver: zodResolver(loanFormSchema),
    defaultValues: {
      studentNumber: "",
      itemId: "",
      destination: "",
      cardReceived: false,
      notes: "",
    },
  });

  // Search students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ['/api/students', { query: studentSearch }],
    enabled: studentSearch.length > 0,
  });

  // Get available items
  const { data: availableItems = [] } = useQuery<Item[]>({
    queryKey: ['/api/items/available'],
  });

  // Group items by category
  const itemsByCategory = availableItems.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, Item[]>);

  const createLoanMutation = useMutation({
    mutationFn: async (data: LoanFormData) => {
      return apiRequest('POST', '/api/loans', {
        studentId: selectedStudent?.studentNo || data.studentNumber,
        itemId: data.itemId,
        destination: data.destination,
        cardReceived: data.cardReceived,
        notes: data.notes,
      });
    },
    onSuccess: () => {
      toast({
        title: "Loan Created",
        description: "The loan has been successfully created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/loans'] });
      queryClient.invalidateQueries({ queryKey: ['/api/stats'] });
      onSuccess();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create loan",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: LoanFormData) => {
    createLoanMutation.mutate({
      ...data,
      cardReceived,
    });
  };

  const handleStudentSelect = (student: Student) => {
    setSelectedStudent(student);
    form.setValue("studentNumber", student.studentNo);
    setStudentSearch("");
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Create New Loan</h2>
          <p className="text-slate-600">Register a new item loan for a student</p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        {/* Student Information */}
        <Card>
          <CardHeader>
            <CardTitle>Student Information</CardTitle>
            <CardDescription>Search for or enter student details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="studentNumber" className="block text-sm font-medium text-slate-700 mb-2">
                  Student Number
                </Label>
                <div className="relative">
                  <Input
                    id="studentNumber"
                    {...form.register("studentNumber")}
                    placeholder="Enter student number"
                    value={selectedStudent ? selectedStudent.studentNo : studentSearch}
                    onChange={(e) => {
                      if (!selectedStudent) {
                        setStudentSearch(e.target.value);
                        form.setValue("studentNumber", e.target.value);
                      }
                    }}
                    className="pr-12"
                    data-testid="input-student-number"
                  />
                  <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
                </div>
                {form.formState.errors.studentNumber && (
                  <p className="text-red-600 text-sm mt-1">{form.formState.errors.studentNumber.message}</p>
                )}
                
                {/* Student Search Results */}
                {students.length > 0 && !selectedStudent && (
                  <div className="mt-2 border border-slate-200 rounded-lg max-h-40 overflow-y-auto">
                    {students.map((student) => (
                      <div
                        key={student.id}
                        onClick={() => handleStudentSelect(student)}
                        className="p-3 hover:bg-slate-50 cursor-pointer border-b border-slate-100 last:border-b-0"
                        data-testid={`student-option-${student.id}`}
                      >
                        <p className="font-medium">{student.name} {student.surname}</p>
                        <p className="text-sm text-slate-600">
                          {student.studentNo} • {student.roomNo ? `Room ${student.roomNo}` : 'No room'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              {selectedStudent && (
                <div>
                  <Label className="block text-sm font-medium text-slate-700 mb-2">
                    Selected Student
                  </Label>
                  <div className="p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{selectedStudent.name} {selectedStudent.surname}</p>
                        <p className="text-sm text-slate-600">
                          {selectedStudent.studentNo} • {selectedStudent.roomNo ? `Room ${selectedStudent.roomNo}` : 'No room'}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedStudent(null);
                          form.setValue("studentNumber", "");
                        }}
                        data-testid="button-clear-student"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Item Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Item Selection</CardTitle>
            <CardDescription>Choose an available item to loan</CardDescription>
          </CardHeader>
          <CardContent>
            <div>
              <Label htmlFor="itemId" className="block text-sm font-medium text-slate-700 mb-2">
                Available Items
              </Label>
              <Select onValueChange={(value) => form.setValue("itemId", value)} data-testid="select-item">
                <SelectTrigger>
                  <SelectValue placeholder="Select an item" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(itemsByCategory).map(([category, items]) => (
                    <div key={category}>
                      <div className="px-2 py-1 text-sm font-medium text-slate-500 bg-slate-50">
                        {category}
                      </div>
                      {items.map((item) => (
                        <SelectItem key={item.id} value={item.id} data-testid={`item-option-${item.id}`}>
                          {item.name} {item.assetTag ? `(${item.assetTag})` : ''} - Available
                        </SelectItem>
                      ))}
                    </div>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.itemId && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.itemId.message}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Loan Details */}
        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
            <CardDescription>Specify where the item will be used and any additional notes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="destination" className="block text-sm font-medium text-slate-700 mb-2">
                Destination/Usage Location
              </Label>
              <Input
                id="destination"
                {...form.register("destination")}
                placeholder="e.g. Study Room 1, Library, Room 204A"
                data-testid="input-destination"
              />
              {form.formState.errors.destination && (
                <p className="text-red-600 text-sm mt-1">{form.formState.errors.destination.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="notes" className="block text-sm font-medium text-slate-700 mb-2">
                Notes/Specifications
              </Label>
              <Textarea
                id="notes"
                {...form.register("notes")}
                rows={3}
                placeholder="Optional notes about the loan or specific requirements..."
                data-testid="input-notes"
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="cardReceived"
                checked={cardReceived}
                onCheckedChange={(checked) => {
                  setCardReceived(checked as boolean);
                  form.setValue("cardReceived", checked as boolean);
                }}
                data-testid="checkbox-card-received"
              />
              <Label htmlFor="cardReceived" className="text-sm text-slate-700">
                Student ID card received as collateral
              </Label>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-slate-200">
          <Button 
            type="button" 
            variant="outline"
            onClick={onSuccess}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={createLoanMutation.isPending}
            data-testid="button-create-loan"
          >
            {createLoanMutation.isPending ? "Creating..." : "Create Loan"}
          </Button>
        </div>
      </form>
    </div>
  );
}
